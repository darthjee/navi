# Explore file-based input for NaviClient engineStart/engineStop

## Context

This issue was split off from #632 ("Allow client to read yaml directly") during its enhance-issue dialogue. #632 covers file-based input for `NaviClient.config()` (and its `configFromJson`/`configFromYaml`/`configFromFiles` variants), which map cleanly onto the `resources`/`clients`/`namespace` YAML/JSON file format read via single-file parsing (no reuse of the engine's `ConfigIncluder`/`ConfigParser`/`NamespaceMapBuilder`).

`POST /api/engine/start` and `POST /api/engine/stop` don't fit that same mold:

- `POST /api/engine/start` accepts an optional `targets` array of `{ namespace, resources? }` entries (see `source/lib/server/handlers/api/ApiEngineStartHandler.js`), scoped per-namespace, falling back to top-level `resources`/default-namespace when `targets` is omitted.
- `POST /api/engine/stop` takes no payload at all.

Neither of these maps directly onto the `resources`/`clients`/`namespace` file format #632 introduces — `targets` entries are just `{ namespace, resources? }` *references* into already-loaded config, not full resource/client definitions. #632 explicitly calls this out as out of scope and defers it here.

This issue is intentionally left in an early/vague state — it exists to capture the problem space and candidate options, not to decide between them. It's meant to be refined later via `/enhance-issue`.

## What needs to be done

Explore whether/how `NaviClient.engineStart`/`engineStop` should support file-based input, and settle on an approach. Candidate options to discuss (not decided yet):

1. **Extend `engineStart` to accept file-based `targets`** — e.g. `engineStartFromFile(path)`, reading a YAML/JSON file listing `{ namespace, resources? }` entries, reusing #632's multi-file/merge conventions where it makes sense.
2. **A combined "push config then start" convenience** — a method/CLI flow that calls `configFromFiles`/`configFromJson`/`configFromYaml` (#632) and then automatically calls `engineStart` with `targets` derived from the namespaces just pushed, so a developer doesn't need two separate calls.
3. **No dedicated file support** — `targets` is a small, lightweight payload (namespace + optional resource names) that may not be worth file-based input at all; keep `engineStart`/`engineStop` JSON-payload-only as they are today.

## Acceptance criteria

- [ ] TODO
