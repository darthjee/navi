# Plan: Remove Duplications from Specs (#66)

Issue: https://github.com/darthjee/navi/issues/66

## Approach

Create reusable factory helpers under `source/spec/support/factories/` (alongside the existing `DummyJobFactory` and `DummyWorkerFactory`) to replace repeated inline object creation across spec files.

Factories live in `spec/support/` and are test-only helpers — they are distinct from the application factories under `source/lib/factories/`.

## Factories to Create

See [factories.md](factories.md) for the full list of factories, their signatures, and which spec files they replace.

## Directory Structure

```
source/spec/support/
  factories/
    DummyJobFactory.js       ← already exists
    DummyWorkerFactory.js    ← already exists
    ClientFactory.js         ← new
    ClientRegistryFactory.js ← new
    ResourceRequestFactory.js← new
    ResourceFactory.js       ← new
    JobRegistryFactory.js    ← new
    WorkersRegistryFactory.js← new
```

## Execution Order

Each step below is an independent PR. Apply them from highest duplication impact to lowest.

### Step 1 — `ResourceRequestFactory`

Eliminates the most widespread duplication. `ResourceRequest` is instantiated inline in 11 spec files.

Files to update: `Job_spec.js`, `Worker_spec.js`, `Resource_spec.js`, `ResourceRequest_spec.js`, `Client_spec.js`, `ConfigLoader_spec.js`, `ConfigParser_spec.js`, `Config_spec.js`, `JobRegistry_spec.js`, `JobFactory_spec.js`, `ResourceRequestCollector_spec.js`.

### Step 2 — `ClientFactory` + `ClientRegistryFactory`

`Client` appears inline in 7 files; `ClientRegistry` in 9 files. Often created together.

Files to update: `Job_spec.js`, `Worker_spec.js`, `ClientRegistry_spec.js`, `Client_spec.js`, `Config_spec.js`, `ConfigLoader_spec.js`, `ConfigParser_spec.js`, `JobFactory_spec.js`, `WorkerFactory_spec.js`, `WorkersAllocator_spec.js`.

### Step 3 — `ResourceFactory`

`Resource` is instantiated inline in 5 files, always wrapping a list of `ResourceRequest` objects.

Files to update: `Config_spec.js`, `Resource_spec.js`, `ConfigLoader_spec.js`, `ConfigParser_spec.js`, `ResourceRequestCollector_spec.js`.

### Step 4 — `JobRegistryFactory` + `WorkersRegistryFactory`

The `JobRegistry + WorkersRegistry + IdentifyableCollection` setup chain is repeated 6+ times.

Files to update: `Worker_spec.js`, `WorkersRegistry_spec.js`, `WorkersAllocator_spec.js`, `Engine_spec.js`, `WorkerFactory_spec.js`.

## Acceptance Criteria

- All factories are placed under `source/spec/support/factories/`.
- Each factory is documented with JSDoc.
- No spec loses coverage or scenario diversity.
- `yarn test` passes with no regressions.
- `yarn lint` passes.
