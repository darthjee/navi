# Plan: Actions Executor

## Overview

Create a dedicated `ActionsExecutor` class responsible for receiving an already-parsed response (JS object or array) and dispatching each action for every item. This class is the single place that knows how to handle both response shapes.

Action-level errors (e.g. `MissingMappingVariable`, `MissingActionResource`) are caught per-action so that a failing action does not prevent the remaining actions from executing.

## Step 1 — Create `NullResponse` exception

If the parsed response is `null`, the body is not in the format we expect. Raise a dedicated exception rather than silently passing `null` to actions.

**New file:** `source/lib/exceptions/NullResponse.js`

```js
import { AppError } from './AppError.js';

class NullResponse extends AppError {
  constructor() {
    super('Response body is null');
  }
}

export { NullResponse };
```

## Step 2 — Create `ActionsExecutor`

**New file:** `source/lib/models/ActionsExecutor.js`

```js
import { Logger } from '../utils/Logger.js';
import { NullResponse } from '../exceptions/NullResponse.js';

class ActionsExecutor {
  #actions;
  #parsed;

  constructor(actions, parsed) {
    this.#actions = actions;
    this.#parsed = parsed;
  }

  execute() {
    if (this.#parsed === null) throw new NullResponse();

    const items = Array.isArray(this.#parsed) ? this.#parsed : [this.#parsed];

    for (const item of items) {
      for (const action of this.#actions) {
        try {
          action.execute(item);
        } catch (error) {
          Logger.error(`Action failed: ${error}`);
        }
      }
    }
  }
}

export { ActionsExecutor };
```

- Throws `NullResponse` immediately if the parsed value is `null` — this is a response-level error, not an action-level one.
- For all other errors raised inside `action.execute()` (e.g. `MissingMappingVariable`, `MissingActionResource`), catches and logs the error then continues with the next action.

## Usage in `ResourceRequest`

`executeActions` remains a thin coordinator: parse → execute.

```js
import { ResponseParser } from './ResponseParser.js';
import { ActionsExecutor } from './ActionsExecutor.js';

executeActions(rawBody) {
  if (this.actions.length === 0) return;

  const parsed = new ResponseParser(rawBody).parse();
  new ActionsExecutor(this.actions, parsed).execute();
}
```

> `ResponseParser.parse()` returns the raw parsed value (object or array) — not a normalised array. Normalisation is `ActionsExecutor`'s responsibility. See [`plan_response_parser.md`](plan_response_parser.md) for the updated `parse()` contract.

## Specs

**New file:** `source/spec/models/ActionsExecutor_spec.js`

Key cases:

- `execute()` with an array response → each action is called once per element
- `execute()` with a single object response → each action is called once
- `execute()` with multiple actions and an array → each action is called for each element (actions × elements total calls)
- `execute()` with `null` parsed response → throws `NullResponse`
- `execute()` when one action throws `MissingMappingVariable` → error is logged, remaining actions still execute
- `execute()` when one action throws `MissingActionResource` → error is logged, remaining actions still execute

**New file:** `source/spec/exceptions/NullResponse_spec.js`

Key cases:

- `error.message` contains `'null'`
- `error.name` equals `'NullResponse'`

## Files to Change

- `source/lib/exceptions/NullResponse.js` — **new**: exception class
- `source/lib/models/ActionsExecutor.js` — **new**: executor class
- `source/lib/models/ResourceRequest.js` — use `ActionsExecutor` inside `executeActions()`
- `source/lib/models/ResponseParser.js` — `parse()` returns the raw parsed value (not normalised array)
- `source/spec/exceptions/NullResponse_spec.js` — **new**: exception unit tests
- `source/spec/models/ActionsExecutor_spec.js` — **new**: unit tests
