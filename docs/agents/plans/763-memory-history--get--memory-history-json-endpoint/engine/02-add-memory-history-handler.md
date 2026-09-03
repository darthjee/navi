# Add MemoryHistoryHandler

Create `source/lib/server/handlers/memory/MemoryHistoryHandler.js`. Copy the
constructor/plumbing pattern from
`source/lib/server/handlers/emissions/EmissionsHandler.js` (private fields,
`constructor(request, response, pageSize)`), but the response body matches
`source/lib/server/handlers/LogsHandler.js`'s bare-array shape, **not**
`EmissionsHandler`'s `{ counts, emissions }` wrapper:

```js
import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { MemoryRegistry } from '../../../registry/MemoryRegistry.js';
import { MemoryDataSerializer } from '../../../serializers/MemoryDataSerializer.js';

/**
 * Executes request-handling behaviour for GET /memory/history.json.
 * Returns a paginated, `last_id`-cursored list of serialized memory readings.
 * @author darthjee
 */
class MemoryHistoryHandler extends RequestHandler {
  #request;
  #response;
  #pageSize;

  constructor(request, response, pageSize) {
    super();
    this.#request = request;
    this.#response = response;
    this.#pageSize = pageSize;
  }

  handle() {
    const { last_id: lastId } = this.#request.query;
    const entries = MemoryRegistry.getEntries({ lastId });

    this.#response.json(MemoryDataSerializer.serialize(entries.slice(0, this.#pageSize)));
  }
}

export { MemoryHistoryHandler };
```

The `../../../` import depth above matches
`server/handlers/memory/MemoryStatusHandler.js`, which lives in the same
folder.

`MemoryRegistry.getEntries({ lastId })` already returns entries oldest-first
and already filters to entries newer than `lastId` — no extra sorting or
filtering needed here. `maximum` is intentionally NOT included in the
response — the frontend already has it from its `/memory/status.json` poll.

## Files to Change

- `source/lib/server/handlers/memory/MemoryHistoryHandler.js` — new file, as
  above.
- `source/spec/lib/server/handlers/memory/MemoryHistoryHandler_spec.js` —
  new spec, copying the structure of
  `source/spec/lib/server/handlers/LogsHandler_spec.js` /
  `source/spec/lib/server/handlers/emissions/EmissionsHandler_spec.js`:
  - `beforeEach`: `MemoryRegistry.build()`, push several entries via
    `MemoryRegistry.add(value, percentage)`.
  - `afterEach`: `MemoryRegistry.reset()`.
  - Assert: the serialized payload shape (`id`, `value`, `percentage`,
    `timestamp` as ISO string) via a fake/mock Express `response.json`
    spy; the `pageSize` cap (pass a small `pageSize` to the constructor,
    push more entries than that, assert only `pageSize` are returned);
    `?last_id=` returning only entries newer than the given id (empty array
    for an unknown/aged-out id, matching `MemoryRegistry.getEntries`'s
    documented quirk).
