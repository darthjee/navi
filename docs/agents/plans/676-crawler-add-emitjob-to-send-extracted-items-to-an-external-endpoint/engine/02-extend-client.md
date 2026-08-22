# Extend Client with a POST/PUT/PATCH JSON method

`Client` (`source/lib/services/Client.js`) only performs GET today: `#requestUrl` hardcodes `axios.get(requestUrl, { timeout, responseType: 'text', headers, maxRedirects: 0, validateStatus: () => true })`, then compares `response.status !== expectedStatus` and throws `RequestFailed(response.status, requestUrl)` on mismatch; `#handleError` rethrows network errors as-is or as `RequestFailed` when `error.response` exists.

Add a new public method, e.g. `emit(method, resourceUrl, body, expectedStatus, logContext)`, following the existing `perform`/`performUrl` shape:

- Builds the absolute URL via the existing private `#buildUrl` (`${this.baseUrl}${resourceUrl}`) — same as `perform`/`performUrl`.
- Dispatches per verb to `axios.post`/`axios.put`/`axios.patch(url, body, { timeout, headers, validateStatus: () => true })` (three call sites, one per verb — **not** a single `axios.request({ method, ... })` call; this matches the issue's ask for three distinct `stubPost`/`stubPut`/`stubPatch` test helpers in Step 05/06, each spying on its own axios method).
- Owns the success/failure decision:
  - `expectedStatus` present (not `undefined`/`null`) → exact match, same as `#requestUrl` today (`response.status !== expectedStatus` → throw `RequestFailed`).
  - `expectedStatus` absent → success when `response.status >= 200 && response.status < 300`; otherwise throw `RequestFailed(response.status, requestUrl)`. This 2xx-range check has no existing precedent in the codebase — it is new logic, introduced here so `Client` stays the single owner of status-matching (consistent with `#requestUrl` already owning it for GET).
- Reuses the existing `#handleError` for network errors (no `response` on the caught error → rethrow as-is; `response` present → `RequestFailed`).
- Logs via `logContext` following the existing `info`/`error` calls in `#requestUrl`.

Decide the exact private helper split (e.g. a shared `#handleResponse(response, expectedStatus, requestUrl, logContext)` used by both the new method and, optionally, refactored into `#requestUrl`) — reuse is preferred over duplicating the exact-match branch, but do not change `#requestUrl`'s existing GET behavior/signature.

## Files to Change

- `source/lib/services/Client.js` — add the new `emit`-style method, per-verb axios dispatch, and default-2xx-or-exact-status logic.
