# Add the GET /extractions.json endpoint

Expose the extraction store over HTTP, a structural copy of the `GET /emissions.json` handler + serializer + route.

## ExtractionSerializer

`source/lib/serializers/ExtractionSerializer.js` — copy `EmissionSerializer.js`. `_serializeObject(record)` returns:

```js
{
  id: record.id,
  parserType: record.parserType,
  originUrl: record.originUrl,
  itemCount: record.itemCount,
  timestamp: record.timestamp.toISOString(),
}
```

## ExtractionsHandler

`source/lib/server/handlers/extractions/ExtractionsHandler.js` — copy `source/lib/server/handlers/emissions/EmissionsHandler.js`. Constructor `(request, response, pageSize)`. `handle()`:

```js
const { last_id: lastId } = this.#request.query;
const records = ExtractionRegistry.getRecords({ lastId });
this.#response.json({
  counts: ExtractionRegistry.counts,
  extractions: ExtractionSerializer.serialize(records.slice(0, this.#pageSize)),
});
```

## Route

`source/lib/server/Router.js` — import `ExtractionsHandler` and add to `GET_ROUTES`, next to the `/emissions.json` line:

```js
'/extractions.json': new HandlerConfig(ExtractionsHandler, this.#webConfig.logsPageSize),
```

## Files to Change

- `source/lib/serializers/ExtractionSerializer.js` — new; copy of `EmissionSerializer.js`.
- `source/lib/server/handlers/extractions/ExtractionsHandler.js` — new; copy of `EmissionsHandler.js`.
- `source/lib/server/Router.js` — import and register `/extractions.json`.
