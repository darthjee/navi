# Extract the #emit spec
Move the `describe('#emit', ...)` block (current lines 202–318) into a new `Client_emit_spec.js`, wrapped in `describe('Client', () => { describe('#emit', ...) })`.

Recreate only the setup `#emit` needs, in a `beforeEach`:
- `LoggerUtils.stubLoggerMethods()`
- `logContext = jasmine.createSpyObj('logContext', ['debug', 'info', 'warn', 'error'])`
- `client = ClientFactory.build({ baseUrl })` with `baseUrl = 'http://example.com'`

`ResourceRequestFactory` is not used by `#emit`; don't import it here. Keep the existing `resourceUrl`, `fullEmitUrl`, `body`, `axiosMethodByVerb`/`stubByVerb` tables and every example, including the per-call headers, default/explicit `expectedStatus` and network-error cases.

## Files to Change
- `source/spec/lib/client/Client_emit_spec.js` — new; `#emit` examples with their own minimal setup
- `source/spec/lib/client/Client_spec.js` — remove the moved `#emit` block
