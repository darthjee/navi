# Plan: Variables Mapper

## Overview

Create a dedicated `VariablesMapper` class responsible for applying a `variables_map` to a response item and producing the transformed variables object. If a source key referenced in the map is missing from the item, a dedicated `MissingMappingVariable` error is raised.

## Step 1 — Create `MissingMappingVariable` exception

**New file:** `source/lib/exceptions/MissingMappingVariable.js`

Follows the same pattern as other exceptions in the project (extends `AppError`):

```js
import { AppError } from './AppError.js';

class MissingMappingVariable extends AppError {
  constructor(variable) {
    super(`Missing variable in response: ${variable}`);
    this.variable = variable;
  }
}

export { MissingMappingVariable };
```

## Step 2 — Create `VariablesMapper`

**New file:** `source/lib/models/VariablesMapper.js`

```js
import { MissingMappingVariable } from '../exceptions/MissingMappingVariable.js';

class VariablesMapper {
  #variablesMap;

  constructor(variablesMap = {}) {
    this.#variablesMap = variablesMap;
  }

  map(item) {
    const entries = Object.entries(this.#variablesMap);
    if (entries.length === 0) return item;
    return Object.fromEntries(entries.map(([src, dest]) => {
      if (!(src in item)) throw new MissingMappingVariable(src);
      return [dest, item[src]];
    }));
  }
}

export { VariablesMapper };
```

- Receives the `variables_map` config object in the constructor.
- `map(item)` returns a new object with renamed keys.
- When `variables_map` is absent or empty, `item` is returned as-is (identity mapping).
- When `variables_map` has entries, only the explicitly mapped fields are included (selective projection + renaming).
- If a source key is not present in `item`, throws `MissingMappingVariable` with the missing key name.

## Usage in `ResourceRequestAction`

`ResourceRequestAction` instantiates `VariablesMapper` in its constructor and delegates mapping to it:

```js
import { Logger } from '../utils/Logger.js';
import { VariablesMapper } from './VariablesMapper.js';

class ResourceRequestAction {
  #mapper;

  constructor({ resource, variables_map = {} }) {
    this.resource = resource;
    this.#mapper = new VariablesMapper(variables_map);
  }

  execute(item) {
    const vars = this.#mapper.map(item);
    Logger.info(`Executing action ${this.resource} for ${JSON.stringify(vars)}`);
  }

  static fromList(array = []) {
    return array.map((attrs) => new ResourceRequestAction(attrs));
  }
}
```

## Specs

**New file:** `source/spec/models/VariablesMapper_spec.js`

Key cases:

- `map(item)` with a populated `variables_map` → returns object with renamed keys only
- `map(item)` with an empty `variables_map` → returns the original item unchanged
- `map(item)` with no `variables_map` (constructor called with `{}`) → returns the original item unchanged
- `map(item)` when a source key is missing from the item → throws `MissingMappingVariable` with the missing key name

**New file:** `source/spec/exceptions/MissingMappingVariable_spec.js`

Key cases:

- `new MissingMappingVariable('kind_id')` → `message` contains `'kind_id'`
- `error.variable` → equals the key passed to the constructor
- `error.name` → equals `'MissingMappingVariable'`

## Files to Change

- `source/lib/exceptions/MissingMappingVariable.js` — **new**: exception class
- `source/lib/models/VariablesMapper.js` — **new**: mapper class
- `source/spec/exceptions/MissingMappingVariable_spec.js` — **new**: exception unit tests
- `source/spec/models/VariablesMapper_spec.js` — **new**: mapper unit tests
