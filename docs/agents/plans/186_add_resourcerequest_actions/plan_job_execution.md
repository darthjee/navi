# Plan: Job Execution

## Overview

After a successful HTTP response, `Job` must call `resourceRequest.executeActions(response.data)` so that all configured actions are triggered with the response body.

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

`client.perform()` returns the full axios response object; the body is in `response.data`.

## Step 1 — Call `executeActions` in `Job.perform()`

In `source/lib/models/Job.js`, capture the response and call `executeActions`:

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

## Step 2 — Update `Job` specs

In `source/spec/models/Job_spec.js`:

- In the successful-request `beforeEach`, add `response.data` to the mock response (e.g., `response = { status: 200, data: [{ id: 1 }] }`).
- Spy on `resourceRequest.executeActions` and assert it is called with `response.data` after a successful `job.perform()`.
- Add a case where the request fails and assert `executeActions` is **not** called.

## Files to Change

- `source/lib/models/Job.js` — capture response, call `executeActions(response.data)`
- `source/spec/models/Job_spec.js` — assert `executeActions` is triggered on success and not on failure
