# Issue: Allow client to read yaml directly

## Description

`navi-hey-client` (the Node.js client for Navi's `/api/*` HTTP namespace) currently only accepts a pre-built JS payload object for `config()`. This issue adds the ability to instead pass one or more YAML/JSON config files — using the same file format Navi's self-hosted engine reads (`namespace`/`resources`/`clients`) — and have the client parse them into the equivalent API payload(s) itself.

## Problem

A developer moving a project from a self-hosted Navi engine to the API-based client currently has to hand-translate their existing YAML/JSON config files into JS payload objects before calling `config()`. There's no way to just point the client at the same config files the engine already uses.

## Expected Behavior

- `NaviClient#config(payload)` keeps working exactly as today (raw JS payload, single `POST /api/config` call) — fully backward compatible.
- New additive methods accept file paths instead of a pre-built payload:
  - `configFromJson(paths)` — forces JSON parsing for every given path, regardless of extension.
  - `configFromYaml(paths)` — forces YAML parsing for every given path, regardless of extension.
  - `configFromFiles(paths)` — auto-detects the parser per path from its extension (`.json` → JSON, `.yml`/`.yaml` → YAML).
- All three accept a single path or an array of paths, parse and validate every given file up front, and throw before sending any request if any file is missing or fails to parse — never applying a partial subset of namespaces.
- When multiple namespaces are involved, the resulting `POST /api/config` calls are issued one at a time, in fan-out order — not in parallel.
- `navi-client`'s `config` action gains three new repeatable flags, alongside the existing `--payload`/`-p`:
  - `--file <path>` (repeatable) — `configFromFiles` semantics.
  - `--json <path>` (repeatable) — `configFromJson` semantics.
  - `--yaml <path>` (repeatable) — `configFromYaml` semantics.
  - `--file`/`--json`/`--yaml` can be freely combined with each other in a single invocation — all given paths are merged into one ordered path list, in **literal command-line order** (e.g. `--file a.yml --json b.json --file c.yml` merges `a.yml`, then `b.json`, then `c.yml`).
  - `--payload` stays exactly as-is and is **mutually exclusive** with the new flags — giving both in the same invocation is a CLI validation error.
- The API (`POST /api/config`) doesn't change at all — the client only builds payloads that already fit its existing contract.

## Solution

**File parsing scope** — the client does **not** reuse or reimplement the engine's `ConfigIncluder`/`ConfigParser`/`NamespaceMapBuilder` (`source/lib/services`). Those exist for boot-time multi-file merging and cross-reference validation against a running `NamespaceMap`, neither of which applies here — the server already validates the payload on `POST /api/config` and returns a 400 on bad input (surfaced today via `ApiRequestFailed`). Instead, the client parses **a single file at a time, non-recursively**:

- No `include:` chain resolution. If a given file has an `include:` key, it is ignored silently — treated like any other top-level key the client doesn't read (`workers`, `web`, `log`, `failure`).
- The client reads the file (YAML or JSON), then extracts `namespace`, `resources`, and `clients` — the same three keys `POST /api/config` expects — and ignores every other top-level key.
- No client-side model validation (no `Resource`/`Client` instantiation, no reference-resolution checks); the raw `resources`/`clients` objects are sent as-is and the server's existing validation is relied upon.

**Multi-file / multi-namespace grouping & fan-out** — `configFromJson`/`configFromYaml`/`configFromFiles` share the same merge/grouping logic once each file is parsed into its `{ namespace, resources, clients }` triple:

- Files are grouped by `namespace` (defaulting to `'default'` when a file omits it), preserving the **order of first appearance** across the given file list — e.g. given files contributing `namespace1, namespace2, namespace1` (in that order), the client sends the merged `namespace1` payload first, then `namespace2` — not alphabetical order, and files don't need to be adjacent to end up in the same group.
- One `POST /api/config` call is issued per distinct namespace group; the method resolves to an array of per-namespace results, in the same fan-out order.
- **Same-namespace collisions**: when two files contribute a resource/client with the same name under the same namespace, the later file (by given order) wins — mirrors the engine's own `NamespaceMapBuilder` merge behavior.

**File/parse errors** — every given file is read and parsed up front, before any request is sent. If any file is missing/unreadable or fails to parse as YAML/JSON, the method throws immediately and **no** `POST /api/config` call is issued for any namespace — avoids partially applying a multi-file/multi-namespace call.

**Fan-out execution order** — the per-namespace `POST /api/config` calls are issued **sequentially**, in fan-out order (one namespace's request is awaited before the next namespace's request is sent), not concurrently. This keeps behavior deterministic and safe if a later namespace's resources/clients end up depending on an earlier one having already been applied server-side.

**Env var resolution** — the client resolves `${VAR}`-style env var references locally (against the client process's own environment), before sending the payload — same substitution behavior as the engine's `EnvStringResolver`, applied client-side to each file's raw content prior to parsing.

New rule, enforced server-side too: the API (`POST /api/config`) must **not** perform env var resolution on an incoming payload — resources/clients arriving through the API are used exactly as given, literally. This is already true today (`ApiConfigHandler` passes the request body straight through to `NamespaceMap.include`; `EnvStringResolver` is only ever invoked by `ConfigIncluder`, which is boot-time file loading only, never the API path) — but this task should add an explicit regression test asserting it, so the guarantee is documented and protected rather than incidental. E.g. a spec verifying that a literal `${SOME_VAR}` string sent through `POST /api/config` is stored/echoed back unresolved, even when `SOME_VAR` is set in the server's environment.

**Scope** — this issue covers `config()` (and its new `configFromJson`/`configFromYaml`/`configFromFiles` variants) only. `engineStart`'s `targets` payload and `engineStop` don't map to the `resources`/`clients`/`namespace` file format introduced here, so file-based input for those is out of scope — tracked separately in #639.

## Benefits

- Lets developers reuse their existing self-hosted Navi YAML/JSON config files verbatim when switching to the API-based client, instead of hand-translating them into JS payloads.
- Fully backward compatible — existing `config(payload)` callers and `--payload` CLI usage are unaffected.
- Closes a latent server-side guarantee gap by adding an explicit regression test that the API never resolves env vars, keeping resolution client-side/boot-time only as intended.
