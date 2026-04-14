# Plan: Deduplicate axios mock-response pattern

## Overview

Create `AxiosUtils.js` in `source/spec/support/utils/` following the `FixturesUtils` naming
convention. Replace 11 inline axios mock patterns across two spec files with calls to
`AxiosUtils.stubGet(status, data)` and `AxiosUtils.stubGetRejection(error)`.

## Context

Both spec files construct axios mock responses inline with slight variations, adding inconsistency:

**`ResourceRequestJob_spec.js`** — always uses `{ status, data: '[]' }` + assignment to outer `let`:
```js
response = { status: 200, data: '[]' };
spyOn(axios, 'get').and.returnValue(Promise.resolve(response));
```

**`Client_spec.js`** — uses `{ status }` only (no `data`), sometimes with intermediate `promise`
variable, sometimes inline, and one rejection case:
```js
const response = { status: 200 };
const promise = Promise.resolve(response);
spyOn(axios, 'get').and.returnValue(promise);

// or
const promise = Promise.reject({ response: { status: 500 } });
spyOn(axios, 'get').and.returnValue(promise);
```

The helper belongs in `spec/support/utils/` (alongside `FixturesUtils.js`), not a new `helpers/`
folder, since that directory already holds test utilities following the same static-class pattern.

## Implementation Steps

### Step 1 — Create `AxiosUtils.js`

Create `source/spec/support/utils/AxiosUtils.js`:

```js
import axios from 'axios';

class AxiosUtils {
  /**
   * Stubs axios.get to resolve with the given status and optional data.
   * @param {number} status - The HTTP status code.
   * @param {string} [data] - Optional response body string.
   * @returns {object} The response object, for use in assertions.
   */
  static stubGet(status, data = undefined) {
    const response = { status, ...(data !== undefined && { data }) };
    spyOn(axios, 'get').and.returnValue(Promise.resolve(response));
    return response;
  }

  /**
   * Stubs axios.get to reject with the given error.
   * @param {*} error - The rejection value.
   */
  static stubGetRejection(error) {
    spyOn(axios, 'get').and.returnValue(Promise.reject(error));
  }
}

export { AxiosUtils };
```

`stubGet` returns the response so callers can store it for `toBeResolvedTo(response)` assertions.
`data` is optional — callers that only care about `status` omit it and get `{ status }` only.

### Step 2 — Update `ResourceRequestJob_spec.js`

Remove the `import axios from 'axios'` (the helper encapsulates it) and add
`import { AxiosUtils } from '../../support/utils/AxiosUtils.js'`.

Replace 4 inline patterns:

| Location | Before | After |
|----------|--------|-------|
| Successful case `beforeEach` (line 43) | `response = { status: 200, data: '[]' }; spyOn(axios, 'get')...` | `response = AxiosUtils.stubGet(200, '[]');` |
| Failing case `beforeEach` (line 83) | `response = { status: 502, data: '[]' }; ...; spyOn(axios, 'get')...` | `response = AxiosUtils.stubGet(502, '[]');` |
| Parameterized URL `beforeEach` (line 121) | `response = { status: 200, data: '[]' }; spyOn(axios, 'get')...` | `response = AxiosUtils.stubGet(200, '[]');` |
| Empty params `beforeEach` (line 142) | `response = { status: 200, data: '[]' }; spyOn(axios, 'get')...` | `response = AxiosUtils.stubGet(200, '[]');` |

### Step 3 — Update `Client_spec.js`

Remove the `import axios from 'axios'` and add
`import { AxiosUtils } from '../../support/utils/AxiosUtils.js'`.

Replace 7 inline patterns:

| Location | Before | After |
|----------|--------|-------|
| Top-level `it` (line 23) | `const response = { status: 200 }; const promise = ...; spyOn(axios, 'get')...` | `const response = AxiosUtils.stubGet(200);` |
| 404-mismatch `it` (line 46) | `const promise = Promise.resolve({ status: 404 }); spyOn(axios, 'get')...` | `AxiosUtils.stubGet(404);` |
| 404-match `it` (line 60) | `const response = { status: 404 }; const promise = ...; spyOn(axios, 'get')...` | `const response = AxiosUtils.stubGet(404);` |
| 5xx `it` (line 82) | `const promise = Promise.reject({ response: { status: 500 } }); spyOn(axios, 'get')...` | `AxiosUtils.stubGetRejection({ response: { status: 500 } });` |
| Timeout `it` (line 97) | `const response = { status: 200 }; spyOn(axios, 'get')...` | `const response = AxiosUtils.stubGet(200);` |
| Headers `it` (line 114) | `const response = { status: 200 }; spyOn(axios, 'get')...` | `const response = AxiosUtils.stubGet(200);` |
| Parameterized URL `it` (line 136) | `const response = { status: 200 }; spyOn(axios, 'get')...` | `const response = AxiosUtils.stubGet(200);` |

## Files to Change

- `source/spec/support/utils/AxiosUtils.js` — **create**: new utility class
- `source/spec/lib/models/ResourceRequestJob_spec.js` — remove `axios` import, add `AxiosUtils` import, replace 4 patterns
- `source/spec/lib/services/Client_spec.js` — remove `axios` import, add `AxiosUtils` import, replace 7 patterns

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `source/`: `yarn test` (CircleCI job: `jasmine`)
- `source/`: `yarn lint` (CircleCI job: `checks`)
- `source/`: `yarn report` (CircleCI job: `checks` — JSCPD duplication report)

## Notes

- No production code changes — purely a test utility refactor.
- `spyOn` is a Jasmine global available in test context; `AxiosUtils` methods are designed to be
  called inside `beforeEach` or `it` blocks where Jasmine globals are active.
- The `axios` import moves into `AxiosUtils.js`, so both spec files can drop their direct
  `axios` import.
- The `data` field is only included in the response when explicitly provided, preserving the
  distinction between `Client_spec.js` responses (`{ status }`) and
  `ResourceRequestJob_spec.js` responses (`{ status, data: '[]' }`).
