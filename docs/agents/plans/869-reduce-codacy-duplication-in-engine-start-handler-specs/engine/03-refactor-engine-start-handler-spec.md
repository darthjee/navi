# Refactor EngineStartHandler_spec
Replace the three `isStopped`/`isRunning` `spyOn` pairs in the `when engine is stopped`, `when engine is running` and `when engine is neither stopped nor running` `beforeEach`es with the `ApplicationStateUtils` helpers from step 01. Keep every `it`, description and assertion unchanged; if a small local helper (e.g. for building the handler and calling `handle()`) removes further repetition without hurting readability, add it inside the spec file.

## Files to Change
- `source/spec/lib/server/handlers/engine/EngineStartHandler_spec.js` — use `ApplicationStateUtils` instead of the inline stub pairs
