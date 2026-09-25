# Migrate Engine_async_spec.js
Replace the local `enqueueJobs` and the `beforeEach`/`afterEach` registry build in `worker/spec/services/Engine_async_spec.js` with `EngineSpecUtils.setup({ workers: ..., engineOptions: ... })`:
- Pass a fresh `IdentifyableCollection` for `workers`. Pass `engineOptions` that inject `new DummyWorkersAllocator({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry })`, using the function-of-ctx form so it is built after the registries.
- Keep `stubWorkersRegistryIdleCheck` local, since only this spec uses it. It reads `ctx.busy`.
- Tests and assertions stay the same.

Then run `yarn spec`, `yarn lint` and `yarn report` (jscpd) in `worker/`. Confirm the spec count is unchanged, and check with `wc -l` that every Engine spec file is under 300 lines.

## Files to Change
- `worker/spec/services/Engine_async_spec.js`: use `EngineSpecUtils` instead of the duplicated setup.
