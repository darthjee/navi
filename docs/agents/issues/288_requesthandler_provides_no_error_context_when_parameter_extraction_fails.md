# Issue: RequestHandler provides no error context when parameter extraction fails

## Description

When route parameter extraction fails in `RequestHandler#handle()`, the current `catch` block returns a 400 response with the error message but performs no server-side logging. There is no record of which route was being matched, what the incoming URL was, or what exception occurred. This makes debugging failed requests difficult, especially in production.

## Problem

- The `catch` block silently consumes the error on the server side; it only sends the message to the client.
- No logging of the request URL, the route pattern, or the original exception.
- Integration issues between `RouteParamsExtractor` and `RequestHandler` are invisible in server logs.
- Ambiguous failures (missing route vs. malformed URL vs. extractor bug) cannot be distinguished from logs alone.

## Expected Behavior

- When extraction fails, the handler should log a warning or error that includes:
  - the incoming request URL (`req.url` or `req.path`)
  - the route pattern (`this.#route`)
  - the error message
- The client-facing response (400 + error message) can remain unchanged.

## Solution

Add a `console.warn` (or `console.error`) call inside the `catch` block before sending the response:

```js
handle(req, res) {
  try {
    const steps = this.#extractorFactory(this.#route, req.params).steps();
    const result = new DataNavigator(this.#data, steps).navigate();
    if (result === null) return notFound(res);
    res.json(this.#serializer ? this.#serializer.serialize(result) : result);
  } catch (e) {
    console.warn(`RequestHandler: extraction failed for route "${this.#route}" (url: ${req.url}) — ${e.message}`);
    res.status(400).json({ error: e.message });
  }
}
```

- Add a test in `RequestHandler_spec.js` that stubs `console.warn` and asserts it is called with the expected message when extraction fails.

## Benefits

- Failed requests are visible in server logs with actionable context.
- Debugging integration issues between `RouteParamsExtractor` and `RequestHandler` is significantly faster.
- Client-facing behaviour is unchanged.

## Affected Files

- `dev/app/lib/RequestHandler.js`
- `dev/app/spec/lib/RequestHandler_spec.js`

---
See issue for details: https://github.com/darthjee/navi/issues/288
