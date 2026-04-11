# Plan: Use Variables When Requesting

## Overview

When `ResourceRequestAction` enqueues a `ResourceRequestJob` it passes mapped variables as `parameters`. Currently those parameters are stored in the job but never applied to the URL before the HTTP request is made. This plan adds URL parameter interpolation so that `{:placeholder}` tokens in a URL template are replaced with the corresponding variable values before the request is performed.

## Context

- `ResourceRequest` already has `needsParams()` which detects `{:placeholder}` tokens in a URL (regex `/\{:\w+\}/`). The placeholder format is `{:key}`.
- `ResourceRequestAction.execute(item)` maps a response item to variables and enqueues a `ResourceRequestJob` with `{ resourceRequest, parameters: vars }`.
- `ResourceRequestJob` stores `#parameters` in its constructor but never uses them during `perform()` — it calls `this.#getClient().perform(this.#resourceRequest)` without forwarding the parameters.
- `Client.perform(resourceRequest)` calls `this.#buildUrl(resourceRequest.url)` directly, ignoring any dynamic parameters.

## Implementation Steps

### Step 1 — Add `resolveUrl(parameters)` to `ResourceRequest`

Add a new public method that accepts a `parameters` object and returns the URL with every `{:key}` token replaced by the corresponding value.

```js
// source/lib/models/ResourceRequest.js

/**
 * Returns the URL with every {:placeholder} token replaced by the
 * corresponding value from the parameters object.
 * Tokens with no matching key are left unchanged.
 * @param {object} [parameters={}] Key-value map of URL parameters.
 * @returns {string} The resolved URL.
 */
resolveUrl(parameters = {}) {
  return this.url.replace(/\{:(\w+)\}/g, (_, key) => parameters[key] ?? `{:${key}}`);
}
```

Leaving unmatched placeholders as-is avoids crashes when a parameter is unexpectedly absent; the request will simply fail at the HTTP level with a visible URL in the logs.

#### Test scenarios — `source/spec/lib/models/ResourceRequest_spec.js`

Inside a new `describe('#resolveUrl', ...)` block:

| Scenario | Setup | Expected result |
|----------|-------|-----------------|
| No placeholders, no parameters | `url = '/categories.json'`, `parameters = {}` | returns `'/categories.json'` unchanged |
| Single placeholder, matching parameter | `url = '/categories/{:id}.json'`, `parameters = { id: 1 }` | returns `'/categories/1.json'` |
| Multiple placeholders, all matched | `url = '/categories/{:cat}/items/{:item}'`, `parameters = { cat: 5, item: 3 }` | returns `'/categories/5/items/3'` |
| Placeholder with no matching key | `url = '/categories/{:id}.json'`, `parameters = {}` | returns `'/categories/{:id}.json'` unchanged |
| No placeholders, extra parameters | `url = '/categories.json'`, `parameters = { id: 1 }` | returns `'/categories.json'` unchanged |

---

### Step 2 — Pass parameters through `Client.perform()`

Update `Client.perform()` to accept an optional `parameters` argument and use `resourceRequest.resolveUrl(parameters)` when building the request URL.

```js
// source/lib/services/Client.js

/**
 * Performs the HTTP request and checks the response status.
 * @param {ResourceRequest} resourceRequest - Information about the URL template and expected status.
 * @param {object} [parameters={}] - Key-value map used to resolve {:placeholder} tokens in the URL.
 * @returns {Promise<object>} Resolves with the axios response.
 * @throws {RequestFailed} If the response status does not match or the request errors.
 */
async perform(resourceRequest, parameters = {}) {
  const requestUrl = this.#buildUrl(resourceRequest.resolveUrl(parameters));
  Logger.info(`[Client:${this.name}] Requesting ${requestUrl}`);
  try {
    return await this.#request(resourceRequest, requestUrl);
  } catch (error) {
    // ... existing error handling unchanged
  }
}
```

#### Test scenarios — `source/spec/lib/services/Client_spec.js`

Add a new `describe('when the url has parameters', ...)` block alongside the existing ones:

| Scenario | Setup | Expected result |
|----------|-------|-----------------|
| Parameters resolve a placeholder | `url = '/categories/{:id}.json'`, `parameters = { id: 42 }`, `baseUrl = 'http://example.com'` | `axios.get` called with `'http://example.com/categories/42.json'` |
| No parameters (regression) | existing `url = '/categories.json'`, no parameters arg | `axios.get` called with `'http://example.com/categories.json'` (no change) |

---

### Step 3 — Forward parameters in `ResourceRequestJob.perform()`

Update `ResourceRequestJob.perform()` to pass `this.#parameters` to the client call.

```js
// source/lib/models/ResourceRequestJob.js

async perform() {
  Logger.info(`Job #${this.id} performing`);
  try {
    this.lastError = undefined;
    const response = await this.#getClient().perform(this.#resourceRequest, this.#parameters);
    this.#resourceRequest.enqueueActions(response.data);
    return response;
  } catch (error) {
    Logger.error(`Job #${this.id} failed: ${error}`);
    this._fail(error);
  }
}
```

#### Test scenarios — `source/spec/lib/models/ResourceRequestJob_spec.js`

Add a new `describe('when the resource request has a parameterized URL', ...)` block:

| Scenario | Setup | Expected result |
|----------|-------|-----------------|
| Parameters are applied to the URL | `url = '/categories/{:id}.json'`, `parameters = { id: 7 }`, `baseUrl = 'http://example.com'` | `axios.get` called with `'http://example.com/categories/7.json'` |
| Empty parameters leave placeholder unchanged | `url = '/categories/{:id}.json'`, `parameters = {}` | `axios.get` called with `'http://example.com/categories/{:id}.json'` |

---

### Step 4 — Update `docs/agents` documentation

#### `docs/agents/architecture.md`

Update the `ResourceRequest` row in the models table to mention `resolveUrl`:

> `ResourceRequest` — A single URL + expected HTTP status code + optional client name + optional actions list. Exposes `enqueueActions(rawBody)` to enqueue action jobs after a successful HTTP request. Exposes `resolveUrl(parameters)` to substitute `{:placeholder}` tokens with runtime values.

#### `docs/agents/flow.md`

**Section 6 — Worker Execution:** Step 2 already reads _"Resolve URL — expand `{:placeholder}` tokens"_ and is correct after this fix. No change needed there.

**Section 7 — Response Processing & Actions:** Remove the stale `TODO` comment about `ResourceRequestAction.execute(item)` (that was fixed in #225). Update the description and the example output to reflect that the action now enqueues `ResourceRequestJob` instances with parameters rather than logging:

```
// Replace:
- **`ResourceRequestAction.execute(item)`** applies `VariablesMapper.map(item)` and currently **logs**: ...
  > **TODO:** This method should instead enqueue a new `ResourceRequestJob` ...

// With:
- **`ResourceRequestAction.execute(item)`** applies `VariablesMapper.map(item)` to obtain
  the parameters, looks up the target resource in `ResourceRegistry`, and enqueues one
  `ResourceRequestJob` per `ResourceRequest` in that resource, passing the mapped variables
  as job parameters. The URL `{:placeholder}` tokens are resolved at request time.
```

Update the example at the end of section 7 to show the enqueued jobs with their resolved URLs instead of the old log lines.

---

## Files to Change

### Source
- `source/lib/models/ResourceRequest.js` — add `resolveUrl(parameters)` method
- `source/lib/services/Client.js` — update `perform()` signature and URL building
- `source/lib/models/ResourceRequestJob.js` — forward `this.#parameters` to `Client.perform()`

### Specs
- `source/spec/lib/models/ResourceRequest_spec.js` — add `#resolveUrl` describe block
- `source/spec/lib/services/Client_spec.js` — add parameterized URL describe block
- `source/spec/lib/models/ResourceRequestJob_spec.js` — add parameterized URL describe block

### Docs
- `docs/agents/architecture.md` — update `ResourceRequest` description to mention `resolveUrl`
- `docs/agents/flow.md` — remove stale TODO in section 7; update example to show job enqueueing

## CI Checks

Before opening a PR, run the following checks for the `source/` folder:
- `source`: `yarn test` (CircleCI job: `jasmine`)
- `source`: `yarn lint` (CircleCI job: `checks`)

## Notes

- The placeholder format `{:key}` is already established by `needsParams()` — the issue's YAML example uses `:id` (without braces), but the codebase convention is `{:id}`. The plan follows the existing convention.
- Leaving unresolved placeholders as-is is a deliberate choice to keep `resolveUrl` side-effect-free. An alternative is to throw a new `MissingUrlVariable` exception (mirroring `MissingMappingVariable` in `VariablesMapper`) for stricter validation — this can be added as a follow-up.
- `ResourceRequestCollector` filters out `needsParams()` requests from the initial enqueue. After this fix, parameterized requests are still only ever enqueued by actions — that contract is unchanged.
