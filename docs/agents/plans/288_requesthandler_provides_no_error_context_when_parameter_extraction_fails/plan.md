# Plan: RequestHandler provides no error context when parameter extraction fails

## Overview

Add a `console.warn` call inside the `catch` block of `RequestHandler#handle()` that logs the route pattern, the incoming URL, and the error message before sending the 400 response. Add a test that stubs `console.warn` and asserts it is called with the expected context.

## Context

`RequestHandler#handle()` already has a try/catch that returns `400 { error: e.message }` (added in issue #283). What is missing is server-side logging: when extraction fails, there is no record of which route was being matched or what URL triggered the failure. `console.warn` is explicitly allowed by the dev app's ESLint config (`'no-console': ['warn', { allow: ['warn', 'error'] }]`).

## Implementation Steps

### Step 1 — Add `console.warn` in the `catch` block

Inside the existing `catch (e)` in `handle()`, add a warn call before the response:

```js
catch (e) {
  console.warn(`RequestHandler: extraction failed for route "${this.#route}" (url: ${req.url}) — ${e.message}`);
  res.status(400).json({ error: e.message });
}
```

### Step 2 — Add a test to `RequestHandler_spec.js`

In the existing `describe('when a URL param is non-numeric')` block, add an assertion that `console.warn` was called. Since Jasmine's `spyOn` can intercept `console.warn`, stub it in a `beforeEach` and assert in `it`:

```js
describe('when a URL param is non-numeric', () => {
  const app = buildTestApp('/categories/:id.json', data);

  beforeEach(() => {
    spyOn(console, 'warn');
  });

  it('returns 400 with an error message', async () => {
    const res = await request(app).get('/categories/abc.json');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('"id"');
  });

  it('logs the route and URL to console.warn', async () => {
    await request(app).get('/categories/abc.json');
    expect(console.warn).toHaveBeenCalledWith(
      jasmine.stringContaining('/categories/:id.json')
    );
    expect(console.warn).toHaveBeenCalledWith(
      jasmine.stringContaining('/categories/abc.json')
    );
  });
});
```

## Files to Change

- `dev/app/lib/RequestHandler.js` — add `console.warn` in the `catch` block of `handle()`
- `dev/app/spec/lib/RequestHandler_spec.js` — add `console.warn` assertion to the non-numeric param test

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `dev/app`: `yarn test` (CircleCI job: `jasmine-dev`)
- `dev/app`: `yarn lint` (CircleCI job: `checks-dev`)

## Notes

- `console.warn` is allowed by the dev app's ESLint rule: `'no-console': ['warn', { allow: ['warn', 'error'] }]`.
- The `spyOn(console, 'warn')` stub prevents the warning from appearing in test output.
- The client-facing 400 response is unchanged.
