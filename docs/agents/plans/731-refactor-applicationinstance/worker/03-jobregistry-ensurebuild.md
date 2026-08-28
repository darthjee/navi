# JobRegistry.ensureBuild

Add the symmetric static method to `worker/lib/background/JobRegistry.js`, next to
`build`:

```js
static ensureBuild(options = {}) {
  if (!JobRegistry.#instance) {
    JobRegistry.build(options);
  }
  return JobRegistry.#instance;
}
```

- Same contract as `WorkersRegistry.ensureBuild`: idempotent, pure no-op on an
  already-built singleton, `options` ignored when already built, returns the
  instance.
- `build()` unchanged (still throws if already built).
- JSDoc mirroring `WorkersRegistry.ensureBuild`.

Rationale: `RegistriesBuilder` calls `JobRegistry.build(...)` too, so it has the
same double-call exposure under the "mocks before run" spec pattern.

## Files to Change

- `worker/lib/background/JobRegistry.js` — new `ensureBuild` static + JSDoc.
