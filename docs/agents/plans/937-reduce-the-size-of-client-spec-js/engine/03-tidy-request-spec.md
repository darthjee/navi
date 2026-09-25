# Tidy the remaining request-behavior spec
After steps 01–02, `Client_spec.js` holds only the `#perform` request-behavior examples (~200 lines). Tidy it without changing what is asserted:

- Remove imports that are no longer used (for example `Client`, if nothing still references it).
- The same `axios.get` options object (`timeout: 5000, responseType: 'text', headers: {}, maxRedirects: 0, validateStatus: jasmine.any(Function)`) is written out four times (base case, timeout, headers, url parameters). Replace these copies with a small in-file helper, e.g. `const getOptions = (overrides = {}) => ({ timeout: 5000, responseType: 'text', headers: {}, maxRedirects: 0, validateStatus: jasmine.any(Function), ...overrides })`.
- The three rejection contexts (non-match 404, 5xx, redirect 301 with expected 200) each build `expectedError` the same way (`jasmine.objectContaining({ name: 'RequestFailed', statusCode, url: fullUrl })`). Where it reads cleanly, use a small `requestFailed(statusCode)` helper or an example table. Keep the distinct assertions per case (the log lines for 404, and header forwarding for 404/5xx).

Stop once the file is readable. None of this is needed to get under 300 lines, so don't over-abstract.

## Files to Change
- `source/spec/lib/client/Client_spec.js` — drop unused imports; dedupe the repeated axios options and the `RequestFailed` matchers
