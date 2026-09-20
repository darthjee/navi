# Refactor ApiEngineStartHandler_spec
Apply the shared helpers and parameterise the repeated scenarios, keeping every scenario and assertion:
- Replace the twelve `responds with 400 when …` `it`s under `when targets is present but malformed` with a table-driven loop inside the spec (`[description, body]` pairs generating one `it` per row, keeping the existing descriptions); each generated spec builds `req = { body }`, awaits `new ApiEngineStartHandler(req, res, 'token').process()` and expects `res.status` to have been called with 400.
- Replace the `isStopped`/`isRunning` `spyOn` pairs (malformed, stopped, running and neither describes) with `ApplicationStateUtils` from step 01.
- Replace the four `NamespaceMap.build` fixtures (`and targets is given` ×2, `and targets carries an object-form resource with parameters`, `and targets carries parameters`, and the inline rebuild in `threads extra parameter keys…`) with `NamespaceMapUtils` from step 02.
- Optionally add a small local helper for the repeated `expect(res.json).toHaveBeenCalledWith({ status: 'running', enqueued, skippedResources })` and the request-building/`process()` boilerplate, only where it stays readable.
- Run `yarn spec` and `yarn lint` in `source/`; the same number of examples (or more, never fewer) must run and pass. Optionally run `yarn report` and compare the jscpd numbers for both files.

## Files to Change
- `source/spec/lib/server/handlers/api/ApiEngineStartHandler_spec.js` — table-driven malformed-`targets` cases; use `ApplicationStateUtils` and `NamespaceMapUtils`; optional local response/request helper
