# Extract the builders spec
Move the `describe('.fromObject', ...)` and `describe('.fromListObject', ...)` blocks (current lines 320–397) out of `Client_spec.js` into a new `Client_builders_spec.js`, wrapped in a top-level `describe('Client', ...)`.

These examples only call `Client.fromObject` / `Client.fromListObject` and inspect the result. They need no axios stubs, logger stubs, `logContext` or shared `client`, so the new file imports only `Client` from `../../../lib/client/Client.js`. Keep every example and assertion as it is.

The four `.fromObject` headers/linkText contexts can optionally become a small example table (config → attribute → expected value), provided every case is still asserted.

## Files to Change
- `source/spec/lib/client/Client_builders_spec.js` — new; `.fromObject` and `.fromListObject` examples
- `source/spec/lib/client/Client_spec.js` — remove the two moved `describe` blocks
