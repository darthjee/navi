# Debug-log outbound requests

Log inside `NaviApiClient#post`, right before the `axios.post` call, so `config`, `engine-start`, and `engine-stop` are all covered uniformly with no per-call-site wiring. Build the logged payload explicitly as `{ method: 'POST', url, body }` — never pass or derive it from the axios request/config object as a whole, since that object carries `headers` (including `Authorization: Bearer <token>`) and would leak the token if naively serialized.

## Files to Change

- `clients/node/lib/NaviApiClient.js` — in `post(path, body)`, before the `axios.post` call, add `Logger.debug('Outbound request', { method: 'POST', url, body })` (import `Logger` from `./logging/Logger.js`). No change to the request itself, error handling, or the `Authorization` header logic.
