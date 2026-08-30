# Carry Retry-After through RequestFailed and Client

`RequestFailed` currently only carries `statusCode` and `url`, dropping the response headers entirely — but honoring a `Retry-After` header on 429s (per the issue) requires `EmitJob` to be able to read it from the error it catches. Both places `Client` constructs a `RequestFailed` need to forward the response headers.

- `RequestFailed` gains an optional `headers` param (default `{}` or `undefined`), stored and exposed for callers to read.
- `Client#handleResponse` passes `response.headers` when constructing `RequestFailed` on a status mismatch.
- `Client#handleError` passes `error.response.headers` when constructing `RequestFailed` from a caught axios error.
- A network-level error with no `error.response` at all (timeout, connection refused, DNS failure) is unaffected — it's re-thrown as-is, not wrapped in `RequestFailed`, exactly as today; `EmitJob` (step 03) treats this case as retryable regardless.

## Files to Change

- `source/lib/exceptions/request/RequestFailed.js` — add the `headers` param/field.
- `source/lib/client/Client.js` — thread `response.headers`/`error.response.headers` through in `#handleResponse` and `#handleError`.
