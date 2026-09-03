# Register the route in Router

In `source/lib/server/Router.js`:

1. Add the import next to the existing `MemoryStatusHandler` import
   (~line 26):

   ```js
   import { MemoryHistoryHandler } from './handlers/memory/MemoryHistoryHandler.js';
   ```

2. Add a new entry to `GET_ROUTES` (~line 71, right after
   `/memory/status.json`):

   ```js
   '/memory/history.json':     new HandlerConfig(MemoryHistoryHandler, this.#webConfig.memory?.dataStorePageSize),
   ```

   **Use the `?.` — this is the one real bug risk in this plan.** `Router`
   defaults `webConfig` to `{}` in its constructor, and
   `source/spec/lib/server/Router_spec.js` constructs `new Router()` with no
   args. The `GET_ROUTES` object literal evaluates
   `this.#webConfig.memory?.dataStorePageSize` eagerly at `build()` time —
   without the `?.`, `this.#webConfig.memory.dataStorePageSize` throws a
   `TypeError` immediately whenever `webConfig.memory` is `undefined`,
   breaking every existing Router spec that doesn't pass `webConfig`. Compare
   with `/memory/status.json`, which only reads `this.#webConfig.memory`
   itself (no further property access), and with `/logs.json` /
   `/emissions.json`, which read a flat `this.#webConfig.logsPageSize` (also
   no chained property access) — this route is the first one in the file to
   chain a property off a possibly-undefined nested config object.

Leave the existing `/memory/status.json` route untouched.

## Files to Change

- `source/lib/server/Router.js` — add the import and the `GET_ROUTES` entry,
  as above.
