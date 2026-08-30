# `GET /emissions.json` endpoint + serializer + stats

Expose the emission data over HTTP, following the `GET /logs.json` precedent
(`LogsHandler` + `LogSerializer` + `LogFilter` + `webConfig.logsPageSize`).

## EmissionSerializer

`source/lib/serializers/EmissionSerializer.js` extends
`source/lib/serializers/Serializer.js`, implementing
`static _serializeObject(record)` → `{ id, status, url, method, httpStatus, error, itemRef, timestamp: record.timestamp.toISOString() }`
(mirrors `LogSerializer`). Spec mirrors `source/spec/lib/serializers/LogSerializer_spec.js`.

## EmissionsHandler

`source/lib/server/handlers/emissions/EmissionsHandler.js` extends
`source/lib/common/server/RequestHandler.js`. Constructor `(request, response, pageSize)`
(same signature/threading as `LogsHandler`). `handle()`:

```js
const { last_id: lastId } = this.#request.query;
const records = EmissionRegistry.getRecords({ lastId });
this.#response.json({
  counts: EmissionRegistry.counts,
  emissions: EmissionSerializer.serialize(records.slice(0, this.#pageSize)),
});
```

`EmissionRegistry.getRecords` already applies `LogFilter` on `{ lastId }` (step 03). The
response envelope is `{ counts, emissions }` — matching the issue's Expected Behavior.
Import `EmissionRegistry` and `EmissionSerializer`.

## Route registration

`source/lib/server/Router.js` — add to `GET_ROUTES`:

```js
'/emissions.json': new HandlerConfig(EmissionsHandler, this.#webConfig.logsPageSize),
```

Reuse `webConfig.logsPageSize` (default 20) rather than introducing a new page-size knob —
it is already the shared "log-like feed" page size and keeps `WebConfig` untouched. Import
`EmissionsHandler`. Add an entry to the `## Routes` table in the handler's JSDoc-adjacent
docs is covered in step 08.

## StatsHandler

`source/lib/server/handlers/StatsHandler.js` — add `emissions: EmissionRegistry.counts` to
the response object, so `GET /stats.json` becomes `{ jobs, workers, emissions }`. This
gives a cheap always-available summary without paging `/emissions.json`. Import
`EmissionRegistry`. Update `source/spec/lib/server/handlers/StatsHandler_spec.js`
(build/reset `EmissionRegistry`, assert the `emissions` key).

## Specs

- `source/spec/lib/server/handlers/emissions/EmissionsHandler_spec.js` — new, mirroring
  `LogsHandler_spec.js`: `beforeEach` builds `EmissionRegistry` (+ `Logger.suppress()` if
  needed), `afterEach` resets. Cover: empty store → `{ counts: {extracted:0,...}, emissions: [] }`;
  populated store → serialized records newest-page; `page size` limit; `last_id` cursor
  pagination; `counts` reflects recorded emissions; `instanceof RequestHandler`.
- `EmissionSerializer_spec.js` — new.
- Extend `Router_spec.js` if it asserts the route table (add `/emissions.json`).

100% diff coverage.

## Files to Change

- `source/lib/serializers/EmissionSerializer.js` — new serializer.
- `source/lib/server/handlers/emissions/EmissionsHandler.js` — new handler for `GET /emissions.json`.
- `source/lib/server/Router.js` — register `/emissions.json` in `GET_ROUTES`.
- `source/lib/server/handlers/StatsHandler.js` — add `emissions: EmissionRegistry.counts`.
- `source/spec/lib/serializers/EmissionSerializer_spec.js` — new spec.
- `source/spec/lib/server/handlers/emissions/EmissionsHandler_spec.js` — new spec.
- `source/spec/lib/server/handlers/StatsHandler_spec.js` — cover the `emissions` key.
- `source/spec/lib/server/Router_spec.js` — cover the new route (if it enumerates routes).
