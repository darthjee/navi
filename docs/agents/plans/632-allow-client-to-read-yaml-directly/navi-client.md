# Navi-Client Plan: Allow client to read yaml directly

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the public surface below (see `plan.md`'s "Shared contracts" for the full description consumed by `docs`), and relies on the guarantee that `POST /api/config` never resolves env vars server-side (see `engine.md`) — so client-side resolution is safe to do exactly once, before sending.

- `NaviClient#configFromJson(paths)` / `#configFromYaml(paths)` / `#configFromFiles(paths)`
- CLI flags `--file`, `--json`, `--yaml` (repeatable, combinable, mutually exclusive with `--payload`)

## Implementation Steps

### Step 1 — Add the `yaml` dependency

Add `yaml` to `clients/node/package.json` `dependencies` (the engine side already depends on it — see `source/lib/services/ConfigIncluder.js` — reuse the same package for parity, pin to a caret range consistent with the engine's version). Run `yarn install` inside `clients/node` to refresh `yarn.lock`.

### Step 2 — Client-local env var resolver

Add `clients/node/lib/EnvStringResolver.js`, a small self-contained port of the engine's `source/lib/common/utils/env_resolver/EnvStringResolver.js`: same `$VAR`/`${VAR}` regex, same substitution behavior (missing var resolves to `''`). The client package has no `Logger` utility and no dependency on `source/`, so use `console.warn` (or drop the warning entirely — judgment call, keep it simple) instead of importing the engine's `Logger`. Do not import anything from `source/` — the client package is published independently and must not depend on it.

### Step 3 — Single-file config parser

Add `clients/node/lib/ConfigFileParser.js`: given a file path and a mode (`'json'` | `'yaml'` | `'auto'`), reads the file, resolves env vars via Step 2's resolver, parses it (auto-detect by extension: `.json` → `JSON.parse`, `.yml`/`.yaml` → `YAML.parse`), then returns `{ namespace, resources, clients }` — `namespace` defaulting to `'default'`, `resources`/`clients` defaulting to `{}`, every other top-level key (including `include`) silently ignored. Reading or parsing failure raises a clear, file-path-including error (new exception class alongside `clients/node/lib/exceptions/ApiRequestFailed.js`, e.g. `ConfigFileParseError` — mirror that exception's shape/JSDoc style) — do not swallow the error.

### Step 4 — Namespace grouping / fan-out ordering

Add `clients/node/lib/ConfigFileGrouper.js`: given an ordered list of `{ path, mode }` entries, parses **every** entry up front via Step 3's parser (fail-fast: if any entry throws, propagate immediately — no partial grouping, no requests). On success, groups the parsed `{ namespace, resources, clients }` triples by `namespace`, preserving order of first appearance across the input list; within a namespace group, later files' `resources`/`clients` entries win on same-name collisions (mirror `source/lib/services/NamespaceMapBuilder.js`'s `#mergeInto` last-wins semantics). Returns an ordered array of `{ namespace, resources, clients }`, one per distinct namespace, in fan-out order.

### Step 5 — `NaviClient` new methods

In `clients/node/client.js`, add:
- `configFromFiles(paths)` — normalizes `paths` to an array, builds `{ path, mode: 'auto' }` entries, runs Step 4's grouper, then `await`s `this.config(group)` **sequentially** (a plain `for...of` loop, not `Promise.all`) for each namespace group in order, collecting results into an array to return.
- `configFromJson(paths)` / `configFromYaml(paths)` — same as above with `mode: 'json'` / `mode: 'yaml'` forced regardless of extension. Factor the shared body into a private helper to avoid duplicating the loop three times.

Keep `config(payload)` completely untouched.

### Step 6 — CLI argument parsing

In `clients/node/lib/CliArgumentsParser.js`, add repeatable `--file`, `--json`, `--yaml` options. `node:util`'s `parseArgs` supports `multiple: true` per-option (each collected into its own array) but does **not** preserve relative order *across* different option names — since the shared contract requires literal command-line order across all three flags interleaved, use `parseArgs({ ..., tokens: true })` and walk the returned `tokens` array (filtering `token.kind === 'option'` entries matching `file`/`json`/`yaml`, in the order they appear) to reconstruct a single ordered `[{ path, mode }]` list. Keep the existing `base-url`/`token`/`action`/`payload` options unchanged. Return the new ordered list alongside the existing fields (e.g. as `configFiles`).

### Step 7 — CLI dispatch & validation

In `clients/node/lib/CliRunner.js`:
- Validation: if `payload` is given together with any `--file`/`--json`/`--yaml` entries, print a clear error to stderr and return exit code `1` (mutual exclusivity, per the shared contract) — extend `#validate` or add a follow-up check before parsing `payload`.
- Dispatch: when `action === 'config'` and `configFiles` is non-empty (and `payload` wasn't given), call `client.configFromFiles(...)`-equivalent — but since entries already carry per-entry forced/auto mode from Step 6, dispatch directly to the grouping helper (Step 4) rather than re-detecting mode; do not go through `configFromJson`/`configFromYaml`/`configFromFiles` here since those assume a single uniform mode for the whole call. (Alternatively: expose the mixed-mode grouping call as a fourth, undocumented-in-README internal method on `NaviClient` that the CLI uses directly — pick whichever keeps `client.js`'s public API exactly the three documented methods; judgment call, keep it consistent with Step 5's factoring.)
- Output: `console.log(JSON.stringify(result, null, 2))` already handles both a single object (`payload` path) and an array (`configFiles` path) — no change needed there.

### Step 8 — Tests

- `clients/node/spec/lib/ConfigFileParser_spec.js` (new) — single-file parsing: JSON/YAML/auto-detect, missing `namespace`/`resources`/`clients` defaults, `include:` key ignored, env var substitution, missing-file and parse-error cases.
- `clients/node/spec/lib/ConfigFileGrouper_spec.js` (new) — multi-file grouping: first-appearance namespace order, last-file-wins collision merge, fail-fast on any bad file (assert **no** partial result / no calls made).
- `clients/node/spec/lib/EnvStringResolver_spec.js` (new) — mirror the engine's resolver spec coverage (`$VAR`, `${VAR}`, missing var).
- `clients/node/spec/lib/CliArgumentsParser_spec.js` (update) — repeatable/combinable `--file`/`--json`/`--yaml` in literal interleaved order.
- `clients/node/spec/lib/CliRunner_spec.js` (update) — `--payload` + file-flags mutual exclusivity error, successful file-based dispatch, array output.
- `clients/node/spec/client_spec.js` (update) — `configFromJson`/`configFromYaml`/`configFromFiles`: single/multiple paths, multi-namespace fan-out order, sequential call ordering (assert the second `POST` isn't issued until the first resolves — e.g. via a manually-controlled mock/spy), fail-fast (no `post` calls when a file is bad).
- New fixture files under `clients/node/spec/support/fixtures/` (new folder) — small `.yml`/`.yaml`/`.json` sample files covering: default namespace, explicit namespace, an `include:` key to prove it's ignored, and a `${VAR}`-referencing value.

## Files to Change

- `clients/node/package.json` — add `yaml` dependency
- `clients/node/yarn.lock` — refreshed by `yarn install`
- `clients/node/client.js` — add `configFromJson`/`configFromYaml`/`configFromFiles`
- `clients/node/lib/EnvStringResolver.js` — new
- `clients/node/lib/ConfigFileParser.js` — new
- `clients/node/lib/ConfigFileGrouper.js` — new
- `clients/node/lib/exceptions/ConfigFileParseError.js` — new
- `clients/node/lib/CliArgumentsParser.js` — add `--file`/`--json`/`--yaml`
- `clients/node/lib/CliRunner.js` — mutual exclusivity validation + file-based dispatch
- `clients/node/spec/lib/ConfigFileParser_spec.js` — new
- `clients/node/spec/lib/ConfigFileGrouper_spec.js` — new
- `clients/node/spec/lib/EnvStringResolver_spec.js` — new
- `clients/node/spec/lib/CliArgumentsParser_spec.js` — update
- `clients/node/spec/lib/CliRunner_spec.js` — update
- `clients/node/spec/client_spec.js` — update
- `clients/node/spec/support/fixtures/*` — new fixture files

## CI Checks

- `clients/node`: `npm run coverage` (CI job: `jasmine-client`)
- `clients/node`: `npm run lint` (CI job: `checks-client`)

## Notes

- `node:util`'s `parseArgs` cross-option ordering (Step 6) is the trickiest part of this plan — verify the `tokens: true` approach actually yields interleaved order before committing to it; fall back to manually pre-scanning `process.argv` for `--file`/`--json`/`--yaml`/`-`-prefixed tokens if `tokens` doesn't behave as expected.
- Keep `client.js`'s public method count exactly at three new methods (`configFromJson`/`configFromYaml`/`configFromFiles`) per the issue — Step 7's CLI-internal mixed-mode call should not become a fourth *documented* method; keep it clearly internal if added.
- No changes needed to `NaviApiClient.js` or `ApiRequestFailed.js` — the new methods reuse the existing `config()` → `apiClient.post('/api/config', ...)` path unchanged.
