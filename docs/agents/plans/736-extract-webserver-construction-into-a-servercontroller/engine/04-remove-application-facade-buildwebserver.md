# Remove Application's buildWebServer facade

`Application.buildWebServer()` is a static facade that just forwards to `ApplicationInstance#buildWebServer()`. Once that instance method is removed (step 03), the facade has nothing to delegate to. Delete it entirely, mirroring how #735 already deleted `Application.buildEngine()` for the same reason when `EngineController` took over engine construction.

## Files to Change
- `source/lib/services/application/Application.js` — remove the `static buildWebServer()` method and its JSDoc block.
