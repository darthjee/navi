# Engine Plan: Add a new restart type

Main plan: [plan.md](plan.md)

## Shared contracts

Must produce: `PATCH /engine/reload` — no request body; `200 { "status": "stopping" }` on success; `409 Conflict` (`ConflictError`) when the engine isn't running. No `/api/engine/reload` counterpart. See [plan.md](plan.md)'s "Shared contracts" for the full rationale.

## Implementation Steps

### Step 1 — Cache the config path on `ApplicationInstance`

In `source/lib/services/ApplicationInstance.js`, add a `#configPath` private field and set it in `loadConfig(configPath)`:

```js
loadConfig(configPath) {
  if (!configPath) {
    throw new ConfigurationFileNotProvided();
  }

  this.#configPath = configPath;
  this.config = Config.fromFile(configPath);
  const logRegistry = LogRegistry.build({ retention: this.config.logConfig.size });
  this.#bufferedLogger = logRegistry.bufferedLogger;
  this.#initRegistries();
}
```

This is needed because `reload()` (Step 2) must re-read the same file later, and today the path is only ever a transient constructor/method parameter.

### Step 2 — Add `ApplicationInstance#reload()`

Add a new method mirroring `restart()`'s shape (`source/lib/services/ApplicationInstance.js:247-254`), but with a config re-read/merge step between `stop()` and `start()`:

```js
async reload() {
  if (this.#engineStatus !== 'running') return;
  await this.stop();
  NamespaceMap.include(ConfigIncluder.resolve(this.#configPath));
  await this.start();
}
```

Notes:
- `ConfigIncluder.resolve(filePath)` (`source/lib/services/ConfigIncluder.js:38-40`) is an existing **static** method that already returns exactly the flat `Array<{namespace, resources, clients, filePath}>` shape `NamespaceMap.include()` expects — the same shape `ConfigLoader` builds internally at boot and the same shape `ApiConfigHandler` merges in for `POST /api/config`. No changes are needed to `ConfigIncluder` or `ConfigLoader` themselves; only `ApplicationInstance` needs to call `ConfigIncluder.resolve()` directly.
- This intentionally only refreshes resources/clients (the namespace map). It does **not** re-read `workers`/`web`/`log`/`failure` config sections — those stay boot-time-only, consistent with `POST /api/config`'s existing scope (which also only ever mutates resources/clients, never those sections).
- Mirrors `restart()`'s defensive no-op when not running; the running-required precondition is enforced by the handler (Step 3), same division of responsibility `restart()`/`EngineRestartHandler` already use.
- Add JSDoc for both the new `#configPath` field and `reload()`, following the existing style on `restart()`.
- New imports needed in `ApplicationInstance.js`: `NamespaceMap` from `../registry/NamespaceMap.js`, `ConfigIncluder` from `./ConfigIncluder.js`.

### Step 3 — Add `Application.reload()` static facade

In `source/lib/services/Application.js`, add a static delegate right after `restart()` (`Application.js:167-172`):

```js
/**
 * Reloads configuration from disk, merging it into the live namespace, then
 * restarts processing.
 * @returns {Promise<void>}
 */
static async reload() {
  return Application.#getInstance().reload();
}
```

### Step 4 — Add `EngineReloadHandler`

Create `source/lib/server/handlers/engine/EngineReloadHandler.js`, copying `EngineRestartHandler.js` (`source/lib/server/handlers/engine/EngineRestartHandler.js`) verbatim except for the class name and the `Application.restart()` → `Application.reload()` call:

```js
import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { ConflictError } from '../../../exceptions/http/ConflictError.js';
import { Application } from '../../../services/Application.js';

/**
 * Executes request-handling behaviour for PATCH /engine/reload.
 * @author darthjee
 */
class EngineReloadHandler extends RequestHandler {
  #response;

  constructor(_request, response) {
    super();
    this.#response = response;
  }

  /**
   * Initiates a config reload + restart. Responds immediately with the transitional status.
   * @returns {Promise<void>}
   */
  async handle() {
    if (!Application.isRunning()) throw new ConflictError();
    Application.reload();
    this.#response.json({ status: 'stopping' });
  }
}

export { EngineReloadHandler };
```

### Step 5 — Register the route

In `source/lib/server/Router.js`, import `EngineReloadHandler` and register it alongside `/engine/restart` (`Router.js:79`):

```js
'/engine/reload':    new HandlerConfig(EngineReloadHandler),
```

## Files to Change

- `source/lib/services/ApplicationInstance.js` — cache `#configPath` in `loadConfig`; add `reload()`; new imports (`NamespaceMap`, `ConfigIncluder`).
- `source/lib/services/Application.js` — add `reload()` static facade delegate.
- `source/lib/server/handlers/engine/EngineReloadHandler.js` — new file, mirrors `EngineRestartHandler.js`.
- `source/lib/server/Router.js` — import and register `/engine/reload`.
- `source/spec/lib/services/ApplicationInstance_spec.js` — add a `#reload` describe block (no existing `#restart` block to mirror — `restart()` currently has no dedicated spec — so follow the style of the neighboring `#stop`/`#continue`/`#start` blocks instead: spy on `stop`/`start`, assert they're called in order; add a case verifying `NamespaceMap.include` is called with `ConfigIncluder.resolve(configPath)`'s result, and a case verifying it no-ops when not running).
- `source/spec/lib/server/handlers/engine/EngineReloadHandler_spec.js` — new file, mirrors `EngineRestartHandler_spec.js` (`source/spec/lib/server/handlers/engine/EngineRestartHandler_spec.js`) with `Application.reload` spied instead of `Application.restart`.

## CI Checks

- `source`: `yarn install && npm run coverage` (CI job: `jasmine`) — runs the full Jasmine suite with coverage.
- `source`: `npm run lint` (CI job: `checks`) — ESLint.
- `source`: `npm run report` (CI job: `checks`) — JSCPD duplication report.

## Notes

- Depends on #612 (`Config#resourceRegistry`/`ApplicationInstance#enqueueFirstJobs` live-lookup fix) being implemented first — `start()`'s re-enqueue step (called at the end of `reload()`) must already correctly reflect the live namespace for this to work end to end.
- `ConfigIncluder.resolve()` can throw `ConfigurationFileNotFound`/`ConfigurationIncludeNotFound` if the on-disk file(s) changed in a way that breaks the include chain since boot — this will propagate out of `reload()` unhandled, surfacing as a 500 from the handler (no existing precedent in this codebase for a friendlier error here; matches how other unexpected errors are already handled by the framework's default error path).
