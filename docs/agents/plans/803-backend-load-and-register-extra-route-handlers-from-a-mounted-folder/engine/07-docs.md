# Update docs/agents/web-server.md

Document the backend route-extension mechanism so `docs/agents/web-server.md`
stays the reference once `docs/agents/future/extension-architecture.md` is deleted
by CLEAN-1 (#807).

## Edits

1. **Source layout** block — add under `source/lib/server/`:

   ```
   ├── extensions/
   │   ├── ExtensionsEnv.js            # resolves NAVI_EXTENSIONS_ENABLED / NAVI_EXTENSIONS_DIR
   │   ├── ExtensionModuleValidator.js # validates a mounted module's descriptor array
   │   └── ExtensionRoutesLoader.js    # scans backend/, imports + registers extra routes
   ```

2. **Routes** section — after the sentence about routes being declared in
   `Router.js`, note that when `NAVI_EXTENSIONS_ENABLED` is truthy, additional
   `GET`/`PATCH`/`POST` routes are loaded from
   `<NAVI_EXTENSIONS_DIR>/backend/*.js` at boot and registered after the stock
   routes (stock always wins on collision).

3. **New section `## Route extensions`** covering:
   - the two env vars and the truthy list (`1`/`true`/`yes`/`on`); off by
     default; no YAML key, no `WebConfig` field.
   - the mounted layout (`backend/` flat, non-recursive, lexicographic order).
   - the module contract: default (or `routes`) export of
     `{ method, path, handler }`; `handler extends RequestHandler` imported as
     `import { RequestHandler } from 'navi-hey/extension'`; per-request
     `new handler(req, res)`; same `RouteRegister` guarantees as stock handlers;
     public by default (no token wiring in v1).
   - error handling: broken module → skip-and-warn, server stays up; enabled but
     `NAVI_EXTENSIONS_DIR` missing/not-a-directory → fail-fast at startup
     (`ExtensionsDirectoryMissing`).
   - collision rules: vs stock → extra skipped + warn; vs earlier extra → later
     skipped + warn; never fatal. The boot audit `Logger.info` line.
   - security posture: opt-in flag is the control; operator-owned code runs
     in-process, **not** sandboxed; `PathValidator` only stops the scan escaping
     `backend/`.
   - **`/engine/reload` does not re-scan** — extensions are fixed for the process
     lifetime; a container restart is required to pick up changes.
   - a short compose example (env var + `./my-extensions:/navi/extensions`
     volume).

Keep the prose style/length consistent with the existing "Menu configuration"
subsection.

## Files to Change

- `docs/agents/web-server.md` — source-layout addition, routes-section note, new
  `## Route extensions` section.
