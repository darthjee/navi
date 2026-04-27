# Plan: Do Not Follow Up on Redirect

## Overview

Disable automatic HTTP redirect following in the `Client` service so that 3xx responses are returned as-is to the rest of the application pipeline.

## Context

The `Client` class (`source/lib/services/Client.js`) uses Axios to perform HTTP requests via the private `#requestUrl` method. Axios follows redirects automatically by default (`maxRedirects` defaults to 5), which means a 3xx response is silently chased and only the final destination response reaches Navi's logging, failure handling, and status-validation logic. The fix is two small config options in the Axios call.

## Implementation Steps

### Step 1 — Add `maxRedirects: 0` and `validateStatus: () => true` to `#requestUrl`

The only method that calls `axios.get` is `#requestUrl`. Both `perform()` and `performUrl()` delegate to it, so a single change covers the whole class.

**Current code** (`source/lib/services/Client.js:108`):

```js
async #requestUrl(requestUrl, expectedStatus) {
  const response = await axios.get(requestUrl, {
    timeout: this.timeout,
    responseType: 'text',
    headers: this.headers,
  });

  if (response.status !== expectedStatus) {
    throw new RequestFailed(response.status, requestUrl);
  }

  return response;
}
```

**After change:**

```js
async #requestUrl(requestUrl, expectedStatus) {
  const response = await axios.get(requestUrl, {
    timeout: this.timeout,
    responseType: 'text',
    headers: this.headers,
    maxRedirects: 0,
    validateStatus: () => true,
  });

  if (response.status !== expectedStatus) {
    throw new RequestFailed(response.status, requestUrl);
  }

  return response;
}
```

- `maxRedirects: 0` — Axios will not follow any redirect.
- `validateStatus: () => true` — Axios always resolves the promise regardless of status code, so 3xx responses reach our own validation logic instead of being thrown as Axios errors. This is safe because `Client` already has its own status check via `RequestFailed`.

### Step 2 — Update existing axios call assertions in the spec

Every `expect(axios.get).toHaveBeenCalledWith(...)` assertion in `Client_spec.js` will fail because the options object now includes the two new properties. Update each to match the new signature:

**Before:**
```js
expect(axios.get).toHaveBeenCalledWith(fullUrl, { timeout: 5000, responseType: 'text', headers: {} });
```

**After:**
```js
expect(axios.get).toHaveBeenCalledWith(fullUrl, {
  timeout: 5000,
  responseType: 'text',
  headers: {},
  maxRedirects: 0,
  validateStatus: jasmine.any(Function),
});
```

Affected assertions (lines ~29, ~90, ~106, ~125 of `Client_spec.js`).

### Step 3 — Add new test scenarios covering redirect behaviour

**How tests work in this project:**

Tests stub `axios.get` via `AxiosUtils.stubGet(status)`, which replaces `axios.get` with a Jasmine spy that immediately resolves with `{ status }`. This means the real Axios option flags (`maxRedirects`, `validateStatus`) are never executed by Axios itself — the spy short-circuits the call. The tests verify behaviour at two levels:

1. **Call-site assertion** — `expect(axios.get).toHaveBeenCalledWith(url, options)` checks that `Client` passes the right options to Axios.
2. **Promise assertion** — `expectAsync(...).toBeResolvedTo(response)` / `toBeRejectedWith(error)` checks the return value or thrown error.

**New scenarios to add to `Client_spec.js`:**

```js
describe('when request is a redirect (3xx) and it is the expected status', () => {
  beforeEach(() => {
    resourceRequest = ResourceRequestFactory.build({ url, status: 301 });
  });

  it('resolves with the redirect response without following it', async () => {
    const response = AxiosUtils.stubGet(301);

    await expectAsync(client.perform(resourceRequest)).toBeResolvedTo(response);
  });
});

describe('when request is a redirect (3xx) but expected status is 200', () => {
  beforeEach(() => {
    expectedError = jasmine.objectContaining({
      name: 'RequestFailed',
      statusCode: 301,
      url: fullUrl,
    });
  });

  it('throws RequestFailed with the redirect status and logs the error', async () => {
    AxiosUtils.stubGet(301);

    await expectAsync(client.perform(resourceRequest)).toBeRejectedWith(expectedError);
    expect(Logger.error).toHaveBeenCalled();
  });
});
```

The first scenario confirms that when the caller expects a 301, the redirect response is returned as a successful result (no follow-up). The second confirms that a surprise redirect is treated as a failure and raises `RequestFailed` with the 3xx code — consistent with how 404 and 5xx mismatches are handled today.

## Files to Change

- `source/lib/services/Client.js` — add `maxRedirects: 0` and `validateStatus: () => true` to the `#requestUrl` Axios config.
- `source/spec/lib/services/Client_spec.js` — update existing call-site assertions and add the two new redirect scenarios.

## Notes

- The `validateStatus: () => true` option makes Axios treat every HTTP response (including 3xx) as a resolved promise. Without it, Axios would throw on redirect status codes when `maxRedirects: 0`, and the error would land in `#handleError` — which would still wrap it in `RequestFailed`, but through the error path rather than the normal response path. Using `validateStatus: () => true` keeps the happy path clean.
- This change may surface previously hidden redirect responses as `RequestFailed` failures in existing Navi configs where the target URL silently redirected. That is the intended behaviour — it makes Navi's status expectations explicit.
- `jasmine.any(Function)` is used in the call-site assertion because `validateStatus: () => true` is an inline arrow function; strict equality would always fail for functions.
