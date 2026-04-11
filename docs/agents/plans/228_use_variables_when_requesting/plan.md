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

Add a new public method that accepts a `parameters` object and returns the URL with every `{:key}` token replaced by `parameters[key]`.

```js
resolveUrl(parameters = {}) {
  return this.url.replace(/\{:(\w+)\}/g, (_, key) => parameters[key] ?? `{:${key}}`);
}
```

Leaving unmatched placeholders as-is (unchanged) avoids breaking requests when a parameter is unexpectedly absent; the request will simply fail at the HTTP level with a clear URL in the log.

Add specs in `source/spec/lib/models/ResourceRequest_spec.js`:
- returns the URL unchanged when there are no placeholders
- substitutes a single placeholder
- substitutes multiple placeholders
- leaves a placeholder unchanged when the key is absent from parameters

### Step 2 — Pass parameters through `Client.perform()`

Update `Client.perform(resourceRequest, parameters = {})` to call `resourceRequest.resolveUrl(parameters)` instead of reading `resourceRequest.url` directly when building the URL.

```js
async perform(resourceRequest, parameters = {}) {
  const requestUrl = this.#buildUrl(resourceRequest.resolveUrl(parameters));
  ...
}
```

Update `Client_spec.js` to cover:
- `perform()` with no parameters still resolves correctly (regression)
- `perform()` with parameters substitutes the placeholder in the URL

### Step 3 — Forward parameters in `ResourceRequestJob.perform()`

Update `ResourceRequestJob.perform()` to pass `this.#parameters` to the client:

```js
const response = await this.#getClient().perform(this.#resourceRequest, this.#parameters);
```

Update `ResourceRequestJob_spec.js` to cover:
- when `parameters` contains a key matching a `{:placeholder}` in the URL, the request is made to the resolved URL

## Files to Change

- `source/lib/models/ResourceRequest.js` — add `resolveUrl(parameters)` method
- `source/lib/services/Client.js` — update `perform()` signature and URL building to use `resolveUrl`
- `source/lib/models/ResourceRequestJob.js` — forward `this.#parameters` to `Client.perform()`
- `source/spec/lib/models/ResourceRequest_spec.js` — add `#resolveUrl` specs
- `source/spec/lib/services/Client_spec.js` — add parameterized URL specs
- `source/spec/lib/models/ResourceRequestJob_spec.js` — add parameterized URL specs

## CI Checks

Before opening a PR, run the following checks for the `source/` folder:
- `source`: `yarn test` (CircleCI job: `jasmine`)
- `source`: `yarn lint` (CircleCI job: `checks`)

## Notes

- The placeholder format `{:key}` is already established by `needsParams()` — the issue's YAML example shows `:id` (without braces), but the codebase convention uses `{:id}`. The plan follows the existing convention.
- Leaving unresolved placeholders as-is is a deliberate choice to keep `resolveUrl` side-effect-free. An alternative is to throw a new `MissingUrlVariable` exception, mirroring `MissingMappingVariable` in `VariablesMapper`. This could be added in a follow-up.
- `ResourceRequestCollector` currently filters out `needsParams()` requests from the initial enqueue. After this fix, parameterized requests will only ever be enqueued by actions — that contract remains unchanged.
