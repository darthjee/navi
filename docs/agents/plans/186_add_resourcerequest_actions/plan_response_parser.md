# Plan: Response Parser

## Overview

Create a dedicated `ResponseParser` class responsible for parsing the raw JSON response body. Invalid or unparseable bodies throw a dedicated `InvalidResponseBody` exception with context about what went wrong.

## Step 1 — Create `InvalidResponseBody` exception

**New file:** `source/lib/exceptions/InvalidResponseBody.js`

```js
import { AppError } from './AppError.js';

class InvalidResponseBody extends AppError {
  constructor(raw, cause) {
    super(`Invalid response body: ${cause.message}`);
    this.raw = raw;
    this.cause = cause;
  }
}

export { InvalidResponseBody };
```

- `error.raw` exposes the original body string for debugging.
- `error.cause` preserves the original `SyntaxError` from `JSON.parse`.

## Step 2 — Create `ResponseParser`

**New file:** `source/lib/models/ResponseParser.js`

```js
import { InvalidResponseBody } from '../exceptions/InvalidResponseBody.js';

class ResponseParser {
  #raw;

  constructor(raw) {
    this.#raw = raw;
  }

  parse() {
    try {
      return JSON.parse(this.#raw);
    } catch (cause) {
      throw new InvalidResponseBody(this.#raw, cause);
    }
  }
}

export { ResponseParser };
```

- Receives the raw response body string in the constructor.
- `parse()` returns the parsed JS value as-is — either an object or an array.
- Normalising to an array is `ActionsExecutor`'s responsibility (see [`plan_actions_executor.md`](plan_actions_executor.md)).
- For now, all responses are assumed to be JSON.
- Any parse failure (invalid JSON, empty string, `undefined`) is caught and rethrown as `InvalidResponseBody`.

## Specs

**New file:** `source/spec/models/ResponseParser_spec.js`

Key cases:

- `parse()` with a JSON array string → returns the parsed array
- `parse()` with a JSON object string → returns the parsed object (not wrapped)
- `parse()` with an invalid JSON string → throws `InvalidResponseBody`
- `parse()` with an empty string → throws `InvalidResponseBody`
- `parse()` with `null` as raw → throws `InvalidResponseBody` (since `JSON.parse(null)` returns `null`, which is valid JSON — but `null` is handled at the `ActionsExecutor` level as `NullResponse`)

**New file:** `source/spec/exceptions/InvalidResponseBody_spec.js`

Key cases:

- `error.message` contains the original parse error message
- `error.raw` holds the original body string
- `error.cause` is the original `SyntaxError`
- `error.name` equals `'InvalidResponseBody'`

## Files to Change

- `source/lib/exceptions/InvalidResponseBody.js` — **new**: exception class
- `source/lib/models/ResponseParser.js` — **new**: parser class
- `source/spec/exceptions/InvalidResponseBody_spec.js` — **new**: exception unit tests
- `source/spec/models/ResponseParser_spec.js` — **new**: unit tests
