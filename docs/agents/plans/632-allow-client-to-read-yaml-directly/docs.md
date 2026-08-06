# Docs Plan: Allow client to read yaml directly

Main plan: [plan.md](plan.md)

## Shared contracts

Documents exactly the public surface `navi-client` produces (see `plan.md`'s "Shared contracts" and `navi-client.md`) — do not invent method names, flags, or behavior beyond what that plan specifies; if this plan is executed before the implementation lands, treat the surface described here as the source of truth to document against.

- `NaviClient#configFromJson(paths)` / `#configFromYaml(paths)` / `#configFromFiles(paths)` — single path or array; single-file parsing only (no `include:` chain); multi-namespace fan-out (grouped by first-appearance order, last-file-wins on same-namespace collisions), one sequential `POST /api/config` per namespace; resolves to an array of results in fan-out order; throws before any request if any file is missing/unreadable/fails to parse; resolves `${VAR}`/`$VAR` env references locally before sending.
- CLI flags `--file <path>`, `--json <path>`, `--yaml <path>` on `--action config` — repeatable, freely combinable with each other in literal command-line order, mutually exclusive with `--payload`/`-p`.

## Implementation Steps

### Step 1 — `clients/node/README.md`

Following the existing structure (Library usage → `NaviClient` tables → CLI usage → tables):
- Add `configFromJson`/`configFromYaml`/`configFromFiles` to the `NaviClient` method table, each mapped to `POST /api/config` (repeated per namespace) with a one-line note on the file-based/fan-out behavior.
- Add a short library-usage example calling `configFromFiles` with a couple of YAML/JSON paths.
- Add `--file`, `--json`, `--yaml` rows to the CLI options table (mark repeatable, note mutual exclusivity with `--payload`).
- Add a CLI example combining `--file`/`--json`/`--yaml`.

### Step 2 — `docs/guides/navi-client/library-usage.md`

Mirror Step 1's library-side additions in this guide's own words/format (it currently documents `config`/`engineStart`/`engineStop` the same way the README does) — add the three new methods to its method table plus a short usage example, consistent with the guide's existing tone.

### Step 3 — `docs/guides/navi-client/cli-usage.md`

Add `--file`/`--json`/`--yaml` to its options table and an example combining them, consistent with the existing `--payload` examples already there. Note the mutual exclusivity with `--payload`.

### Step 4 — `docs/guides/navi-client/reference.md`

No route changes (the API surface is unchanged), but consider a short note under "Error handling" or a new small section clarifying: (a) the client resolves env vars locally before sending, (b) the API itself never resolves env vars in a payload it receives (per the new server-side regression test — `engine.md`) — this distinction is exactly the kind of thing this reference page exists to spell out.

## Files to Change

- `clients/node/README.md`
- `docs/guides/navi-client/library-usage.md`
- `docs/guides/navi-client/cli-usage.md`
- `docs/guides/navi-client/reference.md`

## Notes

- `docs/guides/navi-client/installation.md` and `docs/guides/HOW_TO_USE_NAVI-CLIENT.md` don't need changes — neither describes method/flag surfaces.
- No CI job lints/tests markdown in this repo — omit a CI Checks section.
