# Client recipes and index

Create the four client recipe files under `docs/guides/navi-client/samples/` plus the
`docs/guides/navi-client/samples.md` index, following the "Sample authoring conventions" in
[../docs.md](../docs.md). These recipes drive an already-running Navi instance through
`navi-hey-client`'s `/api/*` wrapper. Footer on every file: `[← Back to Samples](../samples.md)`.

## Recipe files

- **`push-config-and-start.md`** (library) — from a Node script, push a hand-built config and
  start a scoped run. `## Code`: `import { NaviClient } from 'navi-hey-client'`; construct
  with `baseUrl` + `token: process.env.NAVI_API_TOKEN`; `await client.config({ namespace: 'reports', clients: { default: { base_url: 'https://example.com' } }, resources: { categories: [{ url: '/categories.json', status: 200 }] } })`;
  `await client.engineStart({ targets: [{ namespace: 'reports', resources: ['categories'] }] })`.
  "What happens": two sequential POSTs (`/api/config`, then `/api/engine/start`); each
  resolves to the parsed JSON body; a failure or `>= 400` rejects with `ApiRequestFailed`.
  Notes → `../library-usage.md`, `../reference.md`.

- **`config-from-files.md`** (library) — reuse the same YAML/JSON the self-hosted engine
  reads. `## Code`: `await client.configFromFiles(['./config/reports.yml', './config/billing.json'])`.
  "What happens": every file is read and parsed up front (no `include:` chain followed);
  `${VAR}`/`$VAR` in file content is resolved locally against the client process env before
  send; files are grouped by `namespace` (default `'default'`), and one `POST /api/config` is
  issued sequentially per namespace group; the call resolves to an array of per-namespace
  results and throws before sending anything if a file is missing or unparseable. Notes →
  `../library-usage.md`, `../reference.md` (env-var resolution section).

- **`cli-ci-warmup.md`** (CLI) — kick off a run from a CI step with no Node code, via the
  Docker image. `## Command`: a GitHub Actions block and a CircleCI block, each running
  `docker run --rm darthjee/navi-hey-client:latest navi-client --base-url https://your-app.example.com --token $NAVI_API_TOKEN --action engine-start`,
  plus a `--action config --file ./config/reports.yml` variant. Note the image has
  `CMD navi-client` and no `ENTRYPOINT`, so `navi-client` must be named explicitly. "What
  happens": the CLI performs the `/api/*` call, prints the JSON response to stdout on
  success, or prints an error to stderr and exits `1` (failing the CI step). Notes →
  `../cli-usage.md`, `../installation.md`.

- **`error-handling.md`** (library + CLI) — handle a failed API call. `## Code`: a
  `try/catch` around `await client.engineStart()` that inspects
  `err.name === 'ApiRequestFailed'` and logs `err.statusCode`, `err.url`, `err.body`; then a
  one-line `## Command` note that the CLI surfaces the same failure as a stderr message and
  exit status `1`. "What happens": any request that fails outright or returns `>= 400`
  rejects/exits with `ApiRequestFailed` carrying `statusCode`, `url`, `body`. Notes →
  `../reference.md` (error-handling section).

## Index — `docs/guides/navi-client/samples.md`

- `# navi-hey-client Samples` (H1).
- Intro paragraph: recipes for driving a running Navi instance from Node code or a CI shell
  via the `/api/*` wrapper; each recipe is self-contained.
- A single flat bullet list (no sub-sections), matching the guide-TOC style
  `- [Title](samples/file.md) — one-line description.`, one row per recipe above.
- Footer: `[← Back to How to Use navi-hey-client](../HOW_TO_USE_NAVI-CLIENT.md)` (matches
  sibling pages).

Links stay within the `navi-client/` subtree only.

## Files to Change

- `docs/guides/navi-client/samples/push-config-and-start.md` — new recipe (creates the dir).
- `docs/guides/navi-client/samples/config-from-files.md` — new recipe.
- `docs/guides/navi-client/samples/cli-ci-warmup.md` — new recipe.
- `docs/guides/navi-client/samples/error-handling.md` — new recipe.
- `docs/guides/navi-client/samples.md` — new index page.
