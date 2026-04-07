# Plan: Add ResourceRequest Actions

## Overview

Add an optional `actions` list to each `ResourceRequest` config entry. After a successful HTTP response, each action is executed: it applies an optional `variables_map` to the response data and logs a message. If the response is an array, each action runs once per element; if it is a single object, it runs once.

## Context

- `ResourceRequest` (`source/lib/models/ResourceRequest.js`) is a plain model loaded from YAML config. It currently stores only `url`, `status`, and `clientName`.
- `Job.perform()` (`source/lib/models/Job.js`) calls `client.perform(resourceRequest)`, which returns the full axios response object. The return value is currently unused — this is where action execution will be triggered.
- `Resource.fromListObject()` → `ResourceRequest.fromList()` is the config-loading path where YAML attributes are mapped to model instances.
- Logging is done via the static `Logger` facade (`source/lib/utils/Logger.js`).

## Implementation Steps

### Step 1 — Add `ResourceRequestAction` model

Create `source/lib/models/ResourceRequestAction.js`:

- Constructor: `{ resource, variables_map = {} }`
- Method `execute(responseItem)`:
  - If `variables_map` is empty (no entries), use `responseItem` as-is.
  - If `variables_map` has entries, build a transformed object: for each `{ sourceKey: destKey }` pair, set `result[destKey] = responseItem[sourceKey]`.
  - Log: `Executing action ${this.resource} for ${JSON.stringify(transformed)}`
- Static `fromList(array)`: maps raw config objects to `ResourceRequestAction` instances. Returns `[]` when `array` is undefined/empty.

### Step 2 — Update `ResourceRequest` to store and execute actions

In `source/lib/models/ResourceRequest.js`:

- Constructor: accept `actions = []`, pass it through `ResourceRequestAction.fromList(actions)` and store as `this.actions`.
- Add `executeActions(responseData)`:
  - Normalise: `const items = Array.isArray(responseData) ? responseData : [responseData]`
  - For each action and each item: `action.execute(item)`
- Update `fromList()`: spread all attrs (including `actions`) when constructing each `ResourceRequest`, so YAML `actions` entries flow through automatically.

### Step 3 — Trigger actions after a successful response in `Job`

In `source/lib/models/Job.js`, update `perform()`:

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

### Step 4 — Add specs for `ResourceRequestAction`

Create `source/spec/models/ResourceRequestAction_spec.js`:

- `fromList`: returns `[]` when called with undefined or empty array; maps attrs to instances.
- `execute` with `variables_map`: logs the correct transformed object.
- `execute` without `variables_map`: logs the response item as-is.
- `execute` with array response: covered via `executeActions` in the `ResourceRequest` spec (see Step 5).

### Step 5 — Update `ResourceRequest` specs

In `source/spec/models/ResourceRequest_spec.js`:

- `fromList`: add case passing `actions` in the attrs array and verifying they are stored on the instance.
- `executeActions` with array response: spy on `Logger.info`, call `executeActions([...])`, verify log called once per element per action.
- `executeActions` with single object response: verify log called once.

### Step 6 — Update `Job` specs

In `source/spec/models/Job_spec.js`:

- Add a spy on `resourceRequest.executeActions` and assert it is called with `response.data` after a successful perform.
- Verify `executeActions` is NOT called when the request fails.

### Step 7 — Update factories and fixtures

- `source/spec/support/factories/ResourceRequestFactory.js`: add optional `actions = []` param.
- Add `source/spec/support/factories/ResourceRequestActionFactory.js`: `build({ resource = 'products', variables_map = {} } = {})`.
- Add or update a fixture YAML (e.g., `source/spec/support/fixtures/config/sample_config_with_actions.yml`) to include a resource with `actions`.

## Files to Change

- `source/lib/models/ResourceRequestAction.js` — **new file**: action model with `execute()` and `fromList()`
- `source/lib/models/ResourceRequest.js` — store `actions`, add `executeActions()`
- `source/lib/models/Job.js` — call `executeActions(response.data)` after successful request
- `source/spec/models/ResourceRequestAction_spec.js` — **new file**: unit tests
- `source/spec/models/ResourceRequest_spec.js` — tests for actions storage and `executeActions()`
- `source/spec/models/Job_spec.js` — test action triggering
- `source/spec/support/factories/ResourceRequestFactory.js` — add `actions` param
- `source/spec/support/factories/ResourceRequestActionFactory.js` — **new file**
- `source/spec/support/fixtures/config/sample_config_with_actions.yml` — **new file**

## CI Checks

Before opening a PR, run the following checks for the `source/` folder:

- `source`: `docker-compose run --rm source yarn spec` (CircleCI job: `jasmine`)
- `source`: `docker-compose run --rm source yarn lint` (CircleCI job: `checks`)

## Notes

- `variables_map` is optional per action. When absent, the full response item is passed through unchanged.
- When `variables_map` is present, only the explicitly mapped fields appear in the transformed object (selective projection).
- Action execution is fire-and-forget for now (logging only). Future issues will enqueue new jobs based on actions.
- The `response.data` field is the axios-parsed response body, which may be an array or an object depending on the endpoint.
