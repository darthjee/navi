# Plan: ConfigLoader_spec.js

## File
`source/spec/services/ConfigLoader_spec.js` (108 lines)

## Problem

Two `describe` blocks (`when the yaml file is valid` and `when the yaml misses workers definition`)
both independently assign `expectedResources` inside their `beforeEach`. The value is identical
in both cases:

```js
// in "when the yaml file is valid"
expectedResources = { categories: ResourceFactory.build() };

// in "when the yaml misses workers definition"
expectedResources = { categories: ResourceFactory.build() };
```

Additionally, both blocks define the same three `it` assertions in the same order
(`resources`, `clients`, `workersConfig`), making the test structure repetitive.

## Current structure

```
describe('ConfigLoader')
  describe('.fromFile')
    describe('when the yaml file is valid')
      beforeEach → expectedResources = ...; expectedClients = ...(timeout: 5000); expectedWorkersConfig = ...(quantity: 5); load config
      it returns mapped resources
      it returns mapped clients
      it returns workers configuration

    describe('when the yaml misses workers definition')
      beforeEach → expectedResources = ...; expectedClients = ...(); expectedWorkersConfig = ...(quantity: 1); load config
      it returns mapped resources
      it returns mapped clients
      it returns workers default configuration

    describe('when the yaml file does not contain clients key') ...
    describe('when the yaml file does not contain resources key') ...
    describe('when the file is not found') ...
```

## Solution

### Hoist shared `expectedResources` to an outer `beforeEach`

Move the shared assignment to an outer `beforeEach` on the `.fromFile` describe level:

```js
describe('.fromFile', () => {
  beforeEach(() => {
    expectedResources = { categories: ResourceFactory.build() };
  });

  describe('when the yaml file is valid', () => {
    beforeEach(() => {
      expectedClients = { default: ClientFactory.build({ timeout: 5000 }) };
      expectedWorkersConfig = new WorkersConfig({ quantity: 5 });
      config = ConfigLoader.fromFile(FixturesUtils.getFixturePath('config/sample_config.yml'));
    });
    ...
  });

  describe('when the yaml misses workers definition', () => {
    beforeEach(() => {
      expectedClients = { default: ClientFactory.build() };
      expectedWorkersConfig = new WorkersConfig({ quantity: 1 });
      config = ConfigLoader.fromFile(FixturesUtils.getFixturePath('config/missing_workers_config.yml'));
    });
    ...
  });
  ...
});
```

Each inner `describe` keeps only the parts that differ between scenarios.

## Expected outcome

- `expectedResources` is set in one place; both valid-config scenarios share it automatically.
- Each inner `beforeEach` is shorter and more focused on what makes that scenario unique.
- File becomes easier to extend when adding new config scenarios.
