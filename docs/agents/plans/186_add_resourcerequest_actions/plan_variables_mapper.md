# Plan: Variables Mapper

## Overview

Create a dedicated `VariablesMapper` class responsible for applying a `variables_map` to a response item and producing the transformed variables object. This keeps mapping logic isolated and independently testable.

## Class design

**New file:** `source/lib/models/VariablesMapper.js`

```js
class VariablesMapper {
  #variablesMap;

  constructor(variablesMap = {}) {
    this.#variablesMap = variablesMap;
  }

  map(item) {
    const entries = Object.entries(this.#variablesMap);
    if (entries.length === 0) return item;
    return Object.fromEntries(entries.map(([src, dest]) => [dest, item[src]]));
  }
}

export { VariablesMapper };
```

- Receives the `variables_map` config object in the constructor.
- `map(item)` returns a new object with renamed keys.
- When `variables_map` is absent or empty, `item` is returned as-is (identity mapping).
- When `variables_map` has entries, only the explicitly mapped fields are included (selective projection + renaming).

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

## Files to Change

- `source/lib/models/VariablesMapper.js` — **new**: mapper class
- `source/spec/models/VariablesMapper_spec.js` — **new**: unit tests
