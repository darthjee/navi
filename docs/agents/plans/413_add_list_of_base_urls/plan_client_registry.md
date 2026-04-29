# Plan: ClientRegistry Static Facade

## Context

Currently `ClientRegistry` is instantiated and passed around manually. To make it accessible
from the web server layer without threading it through `Application → WebServer → Router →
Handler`, it should be converted into a static singleton facade — the same pattern used by
`JobRegistry` and `WorkersRegistry`.

## Implementation

### Step 1 — Create static `ClientRegistry` facade

Refactor `source/lib/registry/ClientRegistry.js` following the exact pattern of
`JobRegistry` / `WorkersRegistry`:

- The public class (`ClientRegistry`) becomes a static facade.
- An internal `ClientRegistryInstance` class holds the actual data and logic (client map,
  `getClient`, `getItem`, etc.). It extends `NamedRegistry` (current `ClientRegistry` logic
  moves here, including `#getDefaultClient` and `#fetchDefaultClient`).
- `ClientRegistry.build(clients)` creates the singleton instance.
- `ClientRegistry.reset()` clears it (used in tests).
- All existing instance calls (`getClient`, `getItem`, `filter`, `size`) become static methods
  that delegate to the internal instance.
- Add `ClientRegistry.all()` static method (delegates to `ClientRegistryInstance#all()`)
  which returns `Object.values(this.items)` — all registered client instances.

### Step 2 — Update `Application` bootstrap

In `source/lib/services/Application.js`, replace the local instantiation and passing of
`clientRegistry` with a `ClientRegistry.build(clients)` call, mirroring how
`JobRegistry.build(...)` and `WorkersRegistry.build(...)` are called.

### Step 3 — Update `BaseUrlsRequestHandler`

`BaseUrlsRequestHandler` can now call `ClientRegistry.getClients()` (or equivalent) directly,
with no constructor injection needed.

### Step 4 — Update specs

- `source/spec/lib/registry/ClientRegistry_spec.js` — update for the new static facade API;
  call `ClientRegistry.reset()` in `afterEach`.
- `source/spec/lib/services/Application_spec.js` — update bootstrap call.
- `source/spec/lib/server/BaseUrlsRequestHandler_spec.js` — use `ClientRegistry.build(...)`
  in setup instead of injecting an instance.

## Files to Change

- `source/lib/registry/ClientRegistry.js` — refactor to static facade + internal instance
- `source/lib/services/Application.js` — call `ClientRegistry.build(clients)`
- `source/spec/lib/registry/ClientRegistry_spec.js` — update specs
- `source/spec/lib/services/Application_spec.js` — update specs
