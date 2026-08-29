# Migrate existing specs off the removed webServer/buildWebServer surface

Update the remaining specs that touch the now-removed `ApplicationInstance#webServer` field or `buildWebServer()` method directly, following the same migration pattern #735 used when `engine`/`buildEngine()` moved onto `EngineController`.

In `source/spec/lib/services/application/Application_spec.js`:
- Delete the `describe('#buildWebServer', ...)` block (the two tests calling `app.buildWebServer()` directly) — this behavior is now covered by the new `ServerController_spec.js` from step 01.
- Delete the `'sets webServer to null when no web config is present'` test (`expect(app.webServer).toBeNull()`) — `ApplicationInstance` no longer exposes a raw `webServer` field to assert on. The underlying behavior (no server actually starts when there's no web config) stays covered by `Application_webServer_spec.js`'s integration test plus the new `ServerController_spec.js` unit coverage, so this assertion has no replacement to write — just remove it.

In `source/spec/lib/services/application/ApplicationInstance_spec.js`:
- Import `ServerController` from `'../../../../lib/services/engine/ServerController.js'`.
- Change both occurrences of `spyOn(instance, 'buildWebServer').and.returnValue(null);` (in the `#run` describe's `beforeEach`, and in the `'delegation to EngineController'` describe's `beforeEach`) to `spyOn(ServerController.prototype, 'buildWebServer').and.returnValue(null);`.

In `source/spec/lib/services/engine/EngineController_spec.js`:
- Already covered by step 02's spec changes (the `#shutdown` describe block's `webServer` → `serverController` rename) — no additional changes needed here.

`source/spec/lib/services/application/Application_webServer_spec.js` needs no changes — it already spies on `WebServer.prototype.start` directly rather than touching `ApplicationInstance#webServer`, so it keeps working once `ServerController#start()` forwards to the real `WebServer#start()`.

## Files to Change
- `source/spec/lib/services/application/Application_spec.js` — remove the `#buildWebServer` describe block and the `webServer`-null assertion described above.
- `source/spec/lib/services/application/ApplicationInstance_spec.js` — import `ServerController`; retarget both `buildWebServer` spies onto `ServerController.prototype`.
