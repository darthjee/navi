# Plan: Action Model & Config Loading

## Overview

Introduce `ResourceRequestAction` as a new model class, parse it from the YAML config, and store the resulting list inside each `ResourceRequest` instance.

## Context

- `Resource.fromListObject()` iterates the YAML `resources` map and delegates to `Resource.fromObject()`.
- `Resource.fromObject()` calls `ResourceRequest.fromList(obj.resourceRequests, { clientName })`.
- `ResourceRequest.fromList()` maps each raw object to a `new ResourceRequest({ ...attrs, clientName })`.
- Therefore, any new key present in a YAML resource-request entry (such as `actions`) will already be spread into the `ResourceRequest` constructor — we only need to handle it there.

## Step 1 — Create `ResourceRequestAction`

**New file:** `source/lib/models/ResourceRequestAction.js`

```js
import { Logger } from '../utils/Logger.js';

class ResourceRequestAction {
  #variablesMap;

  constructor({ resource, variables_map = {} }) {
    this.resource = resource;
    this.#variablesMap = variables_map;
  }

  execute(responseItem) {
    const vars = this.#applyMap(responseItem);
    Logger.info(`Executing action ${this.resource} for ${JSON.stringify(vars)}`);
  }

  #applyMap(item) {
    const entries = Object.entries(this.#variablesMap);
    if (entries.length === 0) return item;
    return Object.fromEntries(entries.map(([src, dest]) => [dest, item[src]]));
  }

  static fromList(array = []) {
    return array.map((attrs) => new ResourceRequestAction(attrs));
  }
}

export { ResourceRequestAction };
```

### Behaviour

| Scenario | Input item | `variables_map` | Logged vars |
|----------|-----------|-----------------|-------------|
| With mapping | `{ id: 1, name: 'X' }` | `{ id: 'category_id' }` | `{ category_id: 1 }` |
| Without mapping | `{ id: 1, name: 'X' }` | _(absent / empty)_ | `{ id: 1, name: 'X' }` |

## Step 2 — Update `ResourceRequest` to accept and store actions

In `source/lib/models/ResourceRequest.js`:

- Import `ResourceRequestAction`.
- Add `actions = []` to the constructor, convert via `ResourceRequestAction.fromList(actions)`.
- Add `executeActions(responseData)` method.

```js
import { ResourceRequestAction } from './ResourceRequestAction.js';

class ResourceRequest {
  #clientName;

  constructor({ url, status, clientName, actions = [] }) {
    this.url = url;
    this.status = status;
    this.#clientName = clientName;
    this.actions = ResourceRequestAction.fromList(actions);
  }

  executeActions(responseData) {
    const items = Array.isArray(responseData) ? responseData : [responseData];
    for (const action of this.actions) {
      for (const item of items) {
        action.execute(item);
      }
    }
  }

  // ... existing methods unchanged
}
```

> `fromList()` already spreads all attrs: `new ResourceRequest({ ...attrs, clientName })`, so YAML `actions` entries flow through without any change to `Resource` or `ResourceRequest.fromList()`.

## Step 3 — Specs for `ResourceRequestAction`

**New file:** `source/spec/models/ResourceRequestAction_spec.js`

Key cases:

- `.fromList(undefined)` → returns `[]`
- `.fromList([])` → returns `[]`
- `.fromList([{ resource: 'products', variables_map: { id: 'category_id' } }])` → returns one instance
- `#execute` with `variables_map`: spies on `Logger.info`, verifies log message contains mapped vars
- `#execute` without `variables_map`: verifies log message contains the original item fields

## Step 4 — Specs for `ResourceRequest` actions

In `source/spec/models/ResourceRequest_spec.js`, add cases:

- `.fromList` with `actions` in the raw attrs → each resulting `ResourceRequest` has `.actions` populated
- `#executeActions` with array response → `Logger.info` called once per element per action
- `#executeActions` with single object response → `Logger.info` called once per action

## Step 5 — Update `ResourceRequestFactory`

In `source/spec/support/factories/ResourceRequestFactory.js`, add `actions = []` param:

```js
static build({ url = '/categories.json', status = 200, clientName = undefined, actions = [] } = {}) {
  return new ResourceRequest({ url, status, clientName, actions });
}
```

## Step 6 — Add `ResourceRequestActionFactory`

**New file:** `source/spec/support/factories/ResourceRequestActionFactory.js`

```js
import { ResourceRequestAction } from '../../../lib/models/ResourceRequestAction.js';

class ResourceRequestActionFactory {
  static build({ resource = 'products', variables_map = {} } = {}) {
    return new ResourceRequestAction({ resource, variables_map });
  }
}

export { ResourceRequestActionFactory };
```

## Step 7 — Add fixture config with actions

**New file:** `source/spec/support/fixtures/config/sample_config_with_actions.yml`

```yaml
workers:
  quantity: 5
clients:
  default:
    base_url: https://example.com
    timeout: 5000
resources:
  categories:
    - url: /categories.json
      status: 200
      actions:
        - resource: products
          variables_map:
            id: category_id
        - resource: category_information
  products:
    - url: /categories/:category_id/products.json
      status: 200
  category_information:
    - url: /categories/:id.json
      status: 200
      actions:
        - resource: kind
          variables_map:
            kind_id: id
  kind:
    - url: /kinds/:id.json
      status: 200
```

## Files to Change

- `source/lib/models/ResourceRequestAction.js` — **new**: action model
- `source/lib/models/ResourceRequest.js` — add `actions` to constructor, add `executeActions()`
- `source/spec/models/ResourceRequestAction_spec.js` — **new**: unit tests
- `source/spec/models/ResourceRequest_spec.js` — add actions-related cases
- `source/spec/support/factories/ResourceRequestFactory.js` — add `actions` param
- `source/spec/support/factories/ResourceRequestActionFactory.js` — **new**: test factory
- `source/spec/support/fixtures/config/sample_config_with_actions.yml` — **new**: fixture
