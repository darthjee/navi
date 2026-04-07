# Plan: Action Model & Config Loading

## Overview

Introduce `ResourceRequestAction` as a new model class, parse it from the YAML config, and store the resulting list inside each `ResourceRequest` instance.

## Context

- `Resource.fromListObject()` iterates the YAML `resources` map and delegates to `Resource.fromObject()`.
- `Resource.fromObject()` calls `ResourceRequest.fromList(obj.resourceRequests, { clientName })`.
- `ResourceRequest.fromList()` maps each raw object to a `new ResourceRequest({ ...attrs, clientName })`.
- Therefore, any new key present in a YAML resource-request entry (such as `actions`) will already be spread into the `ResourceRequest` constructor — we only need to handle it there.

## Step 1 — Create `MissingActionResource` exception

If an action entry in the YAML config has no `resource` field, constructing `ResourceRequestAction` raises a dedicated exception. The error is caught per-action by `ActionsExecutor`, so remaining actions continue.

**New file:** `source/lib/exceptions/MissingActionResource.js`

```js
import { AppError } from './AppError.js';

class MissingActionResource extends AppError {
  constructor() {
    super('Action is missing the required "resource" field');
  }
}

export { MissingActionResource };
```

## Step 2 — Create `ResourceRequestAction`

**New file:** `source/lib/models/ResourceRequestAction.js`

Delegates mapping to `VariablesMapper` (see [`plan_variables_mapper.md`](plan_variables_mapper.md)):

```js
import { Logger } from '../utils/Logger.js';
import { VariablesMapper } from './VariablesMapper.js';
import { MissingActionResource } from '../exceptions/MissingActionResource.js';

class ResourceRequestAction {
  #mapper;

  constructor({ resource, variables_map = {} }) {
    if (!resource) throw new MissingActionResource();
    this.resource = resource;
    this.#mapper = new VariablesMapper(variables_map);
  }

  execute(item) {
    const vars = this.#mapper.map(item);
    Logger.info(`Executing action ${this.resource} for ${JSON.stringify(vars)}`);
  }

  static fromList(array = []) {
    return array.flatMap((attrs) => {
      try {
        return [new ResourceRequestAction(attrs)];
      } catch (error) {
        Logger.error(`Skipping action: ${error}`);
        return [];
      }
    });
  }
}

export { ResourceRequestAction };
```

> `fromList` catches construction errors (e.g. `MissingActionResource`) per entry, logs them, and excludes the invalid action from the resulting list. The remaining valid actions are unaffected. This mirrors the same "log and continue" philosophy used at execution time in `ActionsExecutor`.

### Behaviour

| Scenario | Input item | `variables_map` | Logged vars |
|----------|-----------|-----------------|-------------|
| With mapping | `{ id: 1, name: 'X' }` | `{ id: 'category_id' }` | `{ category_id: 1 }` |
| Without mapping | `{ id: 1, name: 'X' }` | _(absent / empty)_ | `{ id: 1, name: 'X' }` |
| Missing `resource` | — | — | throws `MissingActionResource` |

## Step 2 — Update `ResourceRequest` to accept and store actions

In `source/lib/models/ResourceRequest.js`:

- Import `ResourceRequestAction` and `ResponseParser`.
- Add `actions = []` to the constructor, convert via `ResourceRequestAction.fromList(actions)`.
- Add `executeActions(rawBody)` method, delegating parsing to `ResponseParser` (see [`plan_response_parser.md`](plan_response_parser.md)).

```js
import { ResourceRequestAction } from './ResourceRequestAction.js';
import { ResponseParser } from './ResponseParser.js';
import { ActionsExecutor } from './ActionsExecutor.js';

class ResourceRequest {
  #clientName;

  constructor({ url, status, clientName, actions = [] }) {
    this.url = url;
    this.status = status;
    this.#clientName = clientName;
    this.actions = ResourceRequestAction.fromList(actions);
  }

  executeActions(rawBody) {
    if (this.actions.length === 0) return;

    const parsed = new ResponseParser(rawBody).parse();
    new ActionsExecutor(this.actions, parsed).execute();
  }

  // ... existing methods unchanged
}
```

### Key design points

- **Early return**: if there are no actions, neither `ResponseParser` nor `ActionsExecutor` are instantiated.
- **Delegation**: parsing is `ResponseParser`'s responsibility; array/object normalisation is `ActionsExecutor`'s responsibility; mapping is `VariablesMapper`'s responsibility (used inside each action).
- **`executeActions` is a thin coordinator**: parse → execute.

> `fromList()` already spreads all attrs: `new ResourceRequest({ ...attrs, clientName })`, so YAML `actions` entries flow through without any change to `Resource` or `ResourceRequest.fromList()`.

### Response body source

`Job.perform()` passes the raw body string to `executeActions`. Details in [`plan_job_execution.md`](plan_job_execution.md).

## Step 4 — Specs for `ResourceRequestAction`

**New file:** `source/spec/models/ResourceRequestAction_spec.js`

Key cases:

- `.fromList(undefined)` → returns `[]`
- `.fromList([])` → returns `[]`
- `.fromList([{ resource: 'products', variables_map: { id: 'category_id' } }])` → returns one instance
- `.fromList` with one entry missing `resource` → logs error, returns `[]` for that entry, valid entries still returned
- `constructor` with no `resource` → throws `MissingActionResource`
- `#execute` with `variables_map`: spies on `Logger.info`, verifies log message contains mapped vars
- `#execute` without `variables_map`: verifies log message contains the original item fields

Also add a spec for `MissingActionResource`:

**New file:** `source/spec/exceptions/MissingActionResource_spec.js`

- `error.name` equals `'MissingActionResource'`
- `error.message` mentions the missing `resource` field

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

- `source/lib/exceptions/MissingActionResource.js` — **new**: exception class
- `source/lib/models/ResourceRequestAction.js` — **new**: action model
- `source/lib/models/ResourceRequest.js` — add `actions` to constructor, add `executeActions()`
- `source/spec/exceptions/MissingActionResource_spec.js` — **new**: exception unit tests
- `source/spec/models/ResourceRequestAction_spec.js` — **new**: unit tests
- `source/spec/models/ResourceRequest_spec.js` — add actions-related cases
- `source/spec/support/factories/ResourceRequestFactory.js` — add `actions` param
- `source/spec/support/factories/ResourceRequestActionFactory.js` — **new**: test factory
- `source/spec/support/fixtures/config/sample_config_with_actions.yml` — **new**: fixture
