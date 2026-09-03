# Extend Router_spec for the new route

In `source/spec/lib/server/Router_spec.js`, add a test next to the existing
`'registers GET /memory/status.json'` example (~line 30), following the
exact same shape:

```js
it('registers GET /memory/history.json', () => {
  const expressRouter = router.build();
  const layer = expressRouter.stack.find((entry) => entry.route?.path === '/memory/history.json');

  expect(layer).toBeDefined();
  expect(layer.route.methods.get).toBeTrue();
});
```

This alone proves the `?.` guard from step 03 works against the file's
existing `router = new Router()` (no args) `beforeEach` — no extra
`webConfig` setup is required for this assertion to pass. No other route in
this spec file asserts that its page-size parameter actually threads through
to the handler (only that the route registers), so this one assertion
matches the file's existing scope — actual page-size behavior is already
covered by `MemoryHistoryHandler_spec.js` (step 02).

## Files to Change

- `source/spec/lib/server/Router_spec.js` — add the two assertions described
  above.
