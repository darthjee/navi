# Add the status handler and route

Add the `GET /memory/status.json` handler and register it, following the shape of
`StatsHandler`/`EngineStatusHandler` (`source/lib/server/handlers/`).

- `ProcessRssReader` — a small seam class wrapping `process.memoryUsage().rss` in a `read()`
  method, so the handler doesn't call `process` directly (same DI convention as the memory-limit
  readers from step 01).
- `MemoryStatusHandler` (`source/lib/server/handlers/memory/MemoryStatusHandler.js`) — extends
  `RequestHandler`; constructor `(_request, response, memoryConfig, rssReader = new
  ProcessRssReader())`. `handle()`:
  - `current = rssReader.read()`
  - `maximum = memoryConfig.maximum`
  - `percentage = (current / maximum) * 100`
  - `status = memoryConfig.statusFor(percentage)`
  - responds `response.json({ current, maximum, percentage, status })` — raw bytes, no rounding
    or formatting (left to consumers, per the issue).
- Register in `source/lib/server/Router.js`'s `GET_ROUTES`:
  `'/memory/status.json': new HandlerConfig(MemoryStatusHandler, [this.#webConfig.memory])` — no
  auth wiring needed, it doesn't extend `SecuredRequestHandler`, same as `/engine/status` and
  `/stats.json`.

## Files to Change

- `source/lib/utils/memory/ProcessRssReader.js` — new.
- `source/lib/server/handlers/memory/MemoryStatusHandler.js` — new.
- `source/lib/server/Router.js` — import and register the new route.
- `spec/lib/utils/memory/ProcessRssReader_spec.js` — new.
- `spec/lib/server/handlers/memory/MemoryStatusHandler_spec.js` — new; cover the full response
  shape using an injected dummy `memoryConfig`/`rssReader`, and a boundary case (e.g. `current`
  exceeding `maximum`, i.e. `percentage > 100`, still responds `"over"` rather than erroring).
- `spec/lib/server/Router_spec.js` — add coverage confirming `/memory/status.json` is registered
  as a GET route.
