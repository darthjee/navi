# Add ApplicationStateUtils
Create a spec helper that stubs the engine state so the handler specs stop repeating the `Application.isStopped` / `Application.isRunning` `spyOn` pairs. It exposes one static method per state used today: stopped (`isStopped` → true, `isRunning` → false), running (`isStopped` → false, `isRunning` → true) and neither (both false). Each method is called from the spec's own `beforeEach` (Jasmine `spyOn` requires a spec context). Document each method with JSDoc, matching the other `*Utils.js` files.

## Files to Change
- `source/spec/support/utils/ApplicationStateUtils.js` — new helper class (name indicative) exporting `ApplicationStateUtils` with the stopped / running / neither stubs
