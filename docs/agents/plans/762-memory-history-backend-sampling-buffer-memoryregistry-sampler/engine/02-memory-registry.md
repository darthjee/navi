# MemoryRegistry + MemoryRegistryInstance

A static-facade + instance registry over the existing (unmodified) `MemoryDataStore`,
following the `EmissionRegistry` / `EmissionRegistryInstance` pattern but with a
**minimal four-method facade**.

## What to do

- `source/lib/registry/MemoryRegistry.js` — static facade, exactly four methods:
  - `build({ retention })` — single key; throws if already built; stores
    `new MemoryRegistryInstance({ retention })`. Do **not** accept `interval` here —
    `interval` stays on `memoryConfig`.
  - `reset()` — for tests.
  - `add(value, percentage)` — **positional** args; silently no-ops when not built (so
    the sampler calls it unconditionally); returns `void`.
  - `getEntries({ lastId } = {})` — delegates to the instance; throws (via a private
    `#getInstance()` that throws `'... has not been built'`) when not built.
  - No `getEntryById` / `clear` / `counts` — see the issue's _Facade surface_.
- `source/lib/registry/MemoryRegistryInstance.js` — wraps `new MemoryDataStore(retention)`
  (positional, matching `EmissionRegistryInstance` → `new EmissionStore(retention)`);
  exposes `get store()`.
  - `add(value, percentage)` → `store.add(...)`, returns the created `MemoryData`.
  - `getEntries({ lastId } = {})` → `new LogFilter(this.#store.getEntries()).filter({ lastId })`,
    exactly as `EmissionRegistryInstance.getRecords` does. Returns **oldest-first**
    (`MemoryDataStore.getEntries()` already yields oldest-first — do not reverse).
    Do NOT add `lastId` filtering into `MemoryDataStore`.
  - JSDoc on `getEntries` must note the consumer contract quirk: `[]` is returned both
    when the caller is caught up and when its `lastId` has aged out of the buffer.
- `MemoryDataStore` / `MemoryData` / `MemoryDataFactory` are **not modified**.
- Specs (`MemoryRegistry_spec.js` + `MemoryRegistryInstance_spec.js`) — structural copy
  of `EmissionRegistry_spec.js` per the issue's _Testing strategy_: `afterEach` reset;
  `.build` returns the instance / forwards `retention` (`.store.retention`) / throws
  `/already been called/` on double build; `.reset` allows rebuild; `.add` no-ops when
  unbuilt and pushes once built; `.getEntries` throws `/not been built/` when unbuilt,
  returns oldest-first, filters by `lastId`, returns `[]` when `lastId` aged out
  (retention exceeded).

## Files to Change

- `source/lib/registry/MemoryRegistry.js` — new static facade.
- `source/lib/registry/MemoryRegistryInstance.js` — new instance holder.
- `source/spec/lib/registry/MemoryRegistry_spec.js` — new.
- `source/spec/lib/registry/MemoryRegistryInstance_spec.js` — new.
