# Plan: Response Parser

## Overview

Create a dedicated `ResponseParser` class responsible for parsing the raw JSON response body and normalising it to an array of items. This keeps parsing logic isolated and independently testable.

## Class design

**New file:** `source/lib/models/ResponseParser.js`

```js
class ResponseParser {
  #raw;

  constructor(raw) {
    this.#raw = raw;
  }

  parse() {
    return JSON.parse(this.#raw);
  }
}

export { ResponseParser };
```

- Receives the raw response body string in the constructor.
- `parse()` returns the parsed JS value as-is — either an object or an array.
- Normalising to an array is `ActionsExecutor`'s responsibility (see [`plan_actions_executor.md`](plan_actions_executor.md)).
- For now, all responses are assumed to be JSON.

## Usage in `ResourceRequest`

`executeActions` instantiates `ResponseParser` and delegates all parsing to it:

```js
import { ResponseParser } from './ResponseParser.js';

executeActions(rawBody) {
  if (this.actions.length === 0) return;

  const items = new ResponseParser(rawBody).parse();

  for (const item of items) {
    for (const action of this.actions) {
      action.execute(item);
    }
  }
}
```

## Specs

**New file:** `source/spec/models/ResponseParser_spec.js`

Key cases:

- `parse()` with a JSON array string → returns the parsed array
- `parse()` with a JSON object string → returns the parsed object (not wrapped)
- `parse()` with an invalid JSON string → throws (default `JSON.parse` behaviour)

## Files to Change

- `source/lib/models/ResponseParser.js` — **new**: parser class
- `source/spec/models/ResponseParser_spec.js` — **new**: unit tests
