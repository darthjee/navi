# Plan: Actions Executor

## Overview

Create a dedicated `ActionsExecutor` class responsible for receiving an already-parsed response (JS object or array) and dispatching each action for every item. This class is the single place that knows how to handle both response shapes.

## Class design

**New file:** `source/lib/models/ActionsExecutor.js`

```js
class ActionsExecutor {
  #actions;
  #parsed;

  constructor(actions, parsed) {
    this.#actions = actions;
    this.#parsed = parsed;
  }

  execute() {
    const items = Array.isArray(this.#parsed) ? this.#parsed : [this.#parsed];

    for (const item of items) {
      for (const action of this.#actions) {
        action.execute(item);
      }
    }
  }
}

export { ActionsExecutor };
```

- Receives the list of `ResourceRequestAction` instances and the already-parsed response value.
- `execute()` normalises the response to an array once, then dispatches each action per item.
- No knowledge of JSON parsing (that is `ResponseParser`'s job) or variable mapping (that is `VariablesMapper`'s job).

## Usage in `ResourceRequest`

`executeActions` becomes a thin coordinator: parse → execute.

```js
import { ResponseParser } from './ResponseParser.js';
import { ActionsExecutor } from './ActionsExecutor.js';

executeActions(rawBody) {
  if (this.actions.length === 0) return;

  const parsed = new ResponseParser(rawBody).parse();
  new ActionsExecutor(this.actions, parsed).execute();
}
```

> `ResponseParser.parse()` now returns the raw parsed value (object or array) — **not** a normalised array. Normalisation is `ActionsExecutor`'s responsibility. See [`plan_response_parser.md`](plan_response_parser.md) for the updated `parse()` contract.

## Specs

**New file:** `source/spec/models/ActionsExecutor_spec.js`

Key cases:

- `execute()` with an array response → each action is called once per element
- `execute()` with a single object response → each action is called once
- `execute()` with multiple actions and an array → each action is called for each element (actions × elements total calls)
- `execute()` with an empty actions list → no calls made

## Files to Change

- `source/lib/models/ActionsExecutor.js` — **new**: executor class
- `source/lib/models/ResourceRequest.js` — use `ActionsExecutor` inside `executeActions()`
- `source/lib/models/ResponseParser.js` — `parse()` returns the raw parsed value (not normalised array)
- `source/spec/models/ActionsExecutor_spec.js` — **new**: unit tests
