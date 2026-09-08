# Docs Plan: Docs: module-level README indexes + move the config schema out of README (token efficiency)

Main plan: [plan.md](plan.md)

## Shared contracts

- Create the canonical guide at **`docs/guides/navi/configuration-schema.md`** with
  `# Configuration Schema` title, then `### Structure` (YAML example) and `### Fields`
  (field tables — anchor `#fields`), and a `[← Back to How to Use Navi](../how_to_use_navi.md)`
  footer to match the other files in `docs/guides/navi/`.
- `### Fields` is the **superset** of the root `README.md` tables and
  `docs/guides/navi/prerequisites.md`:
  - from `README.md`: `web.memory` (`maximum`, `thresholds.{low,medium,high,over}`),
    `web.api.token`, `web.autostart`, `web.idle_timeout`, `emit.size`, `extraction.size`,
    the `GET /memory/status.json` response shape.
  - from `prerequisites.md`: `clients.<name>.timeout`, `enabled`, `disabled`, `max_page`,
    `parser.*`, `emit.*`, and the `parsedBody` / `headers` / `parameters` path-expression
    namespace table + the `parsedBody` camelCase warning.
  - `parser` / `emit`: summarize and link to
    [`extraction-configuration.md`](extraction-configuration.md) /
    [`emit-configuration.md`](emit-configuration.md) — do not re-expand their full field
    breakdowns here.
- Replacement blurb wherever the schema block is removed (see main plan's Shared
  contracts): "Navi is configured via a YAML file that defines HTTP clients, resources, and
  the worker pool size. See the [configuration schema](<link>) for the full field-by-field
  reference." — `<link>` is `docs/guides/navi/configuration-schema.md` from root
  `README.md`, and the absolute
  `https://github.com/darthjee/navi/blob/main/docs/guides/navi/configuration-schema.md`
  from `DOCKERHUB_DESCRIPTION.md`.
- `engine` owns the identical trim in `source/README.md` — not this agent.
- Leave `docs/guides/navi/prerequisites.md` unchanged.

## Implementation Steps

### Step 1 — Create `docs/guides/navi/configuration-schema.md`

Assemble the canonical schema doc:

1. `### Structure` — the full annotated YAML example. Start from the root `README.md`
   `### Structure` block (lines ~95–175: `workers`, `log`, `failure`, `web` incl.
   `web.memory`, `clients` incl. `timeout`, `resources` with `actions` /
   `paginated_actions` / `assets`), and fold in `disabled` / `enabled` on a resource entry
   from `prerequisites.md`.
2. `### Fields` — merge the `README.md` field table and the `prerequisites.md` field table
   into one superset table (or a set of per-section tables) per the Shared contracts list
   above. Keep the existing table wording; don't paraphrase rows that already exist.
3. Add the `parsedBody` / `headers` / `parameters` namespace table and the **`parsedBody`
   is camelCase** warning block, copied from `prerequisites.md`.
4. Add the `GET /memory/status.json` response-shape snippet from `README.md` (lines
   ~236–241).
5. Footer: `[← Back to How to Use Navi](../how_to_use_navi.md)`.

Match the heading style of `docs/guides/navi/reference.md` / `prerequisites.md` (`#` title,
`###` subsections).

### Step 2 — Remove the schema copies `docs` owns and wire up links

1. **`README.md`** — replace the body of `## Configuration File` (the `### Structure` and
   `### Fields` subsections, ~lines 95–241) with the replacement blurb + relative link to
   `docs/guides/navi/configuration-schema.md`. Optionally keep a ~5–10 line YAML skeleton
   for orientation. **Keep** the `## Configuration File` heading (ToC anchor
   `#configuration-file`, L31) and the `### Custom Configuration` subsection (anchor
   `#custom-configuration`, links at L87 / L307) exactly as they are.
2. **`README.md` L485** — repoint `See the [Configuration File Fields](#fields) table
   below` to `docs/guides/navi/configuration-schema.md#fields` and drop "below" wording.
3. **`DOCKERHUB_DESCRIPTION.md`** — replace `## Configuration File` `### Structure` +
   `### Fields` (~lines 66–175) with the replacement blurb + the **absolute** GitHub URL.
   Leave its `## Resource Chaining` / `## Paginated Actions` sections alone.
4. **`docs/guides/how_to_use_navi.md`** — add a Table of Contents entry for the new guide,
   e.g. after the `Prerequisites` line:
   `- [Configuration Schema](./navi/configuration-schema.md) — full YAML field-by-field reference for every config key.`
5. **`docs/guides/navi/reference.md`** — add a one-line cross-reference to
   `configuration-schema.md` (sibling link) where it first mentions config fields, e.g.
   under `### Production Docker image configuration` or a new short intro line.

## Files to Change

- `docs/guides/navi/configuration-schema.md` — **new**: canonical superset config schema
- `README.md` — trim `## Configuration File` to blurb + link; repoint L485 `#fields` link;
  keep `#configuration-file` and `#custom-configuration` intact
- `DOCKERHUB_DESCRIPTION.md` — trim `## Configuration File` schema block to blurb +
  absolute link; leave Resource Chaining / Paginated Actions
- `docs/guides/how_to_use_navi.md` — add ToC entry for the new guide
- `docs/guides/navi/reference.md` — add a cross-reference to the new guide

## CI Checks

None. `docs/` and root `.md` changes trigger no CI job. `update-description` pushes the
edited `DOCKERHUB_DESCRIPTION.md` to Docker Hub only on a release tag (intended).

## Notes

- Do not touch `docs/agents/*` or `AGENTS.md` — that is `architect`'s scope.
- After editing, run `grep -rn '#fields\|#structure' --include='*.md' .` and confirm no
  intra-repo anchor now points at a removed `README.md` section.
- Keep the root `README.md` `**Current Version:** [...]` line untouched
  (`scripts/check_tag_version.sh` greps it on release).
