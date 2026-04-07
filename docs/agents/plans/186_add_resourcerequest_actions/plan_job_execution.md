# Plan: Job Execution

## Overview

After a successful HTTP response, `Job` must pass the raw response body to `resourceRequest.executeActions()` so that JSON parsing and action dispatch happen in one place. If there are no actions, `executeActions` returns immediately without parsing.

## Context

`Job.perform()` currently returns the axios response but discards it:

```js
async perform() {
  Logger.info(`Job #${this.id} performing`);
  try {
    this.lastError = undefined;
    return await this.#getClient().perform(this.#resourceRequest);
  } catch (error) {
    Logger.error(`Job #${this.id} failed: ${error}`);
    this._fail(error);
  }
}
```

`client.perform()` calls `axios.get()`. By default, axios parses JSON automatically and returns the parsed object in `response.data`. To keep parsing in a single place (`executeActions`), we need the raw response body string instead.

## Step 1 — Return raw body from `Client`

In `source/lib/services/Client.js`, configure axios to return raw text so that `response.data` is the unparsed body string:

```js
async #request(resourceRequest, requestUrl) {
  const response = await axios.get(requestUrl, {
    timeout: this.timeout,
    responseType: 'text',
  });

  if (response.status !== resourceRequest.status) {
    throw new RequestFailed(response.status, requestUrl);
  }

  return response;
}
```

With `responseType: 'text'`, `response.data` will be the raw JSON string regardless of the Content-Type header.

## Step 2 — Call `executeActions` in `Job.perform()`

In `source/lib/models/Job.js`, capture the response and pass the raw body:

```js
async perform() {
  Logger.info(`Job #${this.id} performing`);
  try {
    this.lastError = undefined;
    const response = await this.#getClient().perform(this.#resourceRequest);
    this.#resourceRequest.executeActions(response.data);
    return response;
  } catch (error) {
    Logger.error(`Job #${this.id} failed: ${error}`);
    this._fail(error);
  }
}
```

`response.data` is now the raw JSON string. `executeActions` will parse it (once) only if there are actions.

## Step 3 — Update specs

### `Client` specs (`source/spec/services/Client_spec.js`)

- Update axios mock to return `data` as a string (e.g., `'{"id":1}'`) instead of an object.
- Assert that `responseType: 'text'` is passed to `axios.get`.

### `Job` specs (`source/spec/models/Job_spec.js`)

- Update the mock response to include `data` as a raw string (e.g., `response = { status: 200, data: '[{"id":1}]' }`).
- Spy on `resourceRequest.executeActions` and assert it is called with `response.data` after a successful `job.perform()`.
- Add a case where the request fails and assert `executeActions` is **not** called.

## Files to Change

- `source/lib/services/Client.js` — add `responseType: 'text'` to axios call
- `source/lib/models/Job.js` — capture response, call `executeActions(response.data)`
- `source/spec/services/Client_spec.js` — assert `responseType: 'text'`, update mock data to string
- `source/spec/models/Job_spec.js` — assert `executeActions` is triggered on success and not on failure
