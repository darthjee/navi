# Plan: dev/app spec files

## Files
- `dev/app/spec/app_spec.js`
- `dev/app/spec/lib/Router_spec.js`
- `dev/app/spec/lib/RouteRegister_spec.js`
- `dev/app/spec/lib/RequestHandler_spec.js`
- `dev/app/spec/support/fixtures/expectedResponses.js` ← new file

---

## Problem 1 — Repeated inline response payloads

`Router_spec.js`, `RouteRegister_spec.js`, and `RequestHandler_spec.js` all assert the same
literal response payloads inline:

```js
// repeated across files:
expect(res.body).toEqual({ id: 1, name: 'The Hobbit' });
expect(res.body).toEqual({ id: 1, name: 'Books' });
expect(res.body).toEqual([
  { id: 1, name: 'Books' },
  { id: 2, name: 'Movies' },
  { id: 3, name: 'Music' },
]);
```

If the fixture data changes, all three files must be updated manually.

## Solution 1 — Shared `expectedResponses.js` fixture

Create `dev/app/spec/support/fixtures/expectedResponses.js`:

```js
export const BOOKS_CATEGORY = { id: 1, name: 'Books' };
export const HOBBIT_ITEM    = { id: 1, name: 'The Hobbit' };
export const ALL_CATEGORIES = [
  { id: 1, name: 'Books' },
  { id: 2, name: 'Movies' },
  { id: 3, name: 'Music' },
];
```

Import and use these constants in `Router_spec.js`, `RouteRegister_spec.js`, and
`RequestHandler_spec.js` wherever the corresponding inline literals currently appear.

---

## Problem 2 — `app_spec.js` vs `Router_spec.js` overlap

Both files test the same four HTTP routes. Without context it looks like duplication, but the
two files have different scopes:

| File | Scope | App setup | Assertion style |
|------|-------|-----------|-----------------|
| `app_spec.js` | Integration — full app including 404 middleware | `buildApp(data)` | Loose (`toBeGreaterThan(0)`) |
| `Router_spec.js` | Unit — `Router` class in a minimal Express app | `new Router(data).build()` | Exact body equality |

No structural change is needed. Add a one-line comment at the top of each file clarifying the
testing boundary so future contributors understand why both exist.

```js
// app_spec.js
// Integration tests: exercises the full application stack including the 404 middleware.

// Router_spec.js
// Unit tests: exercises the Router class in isolation inside a minimal Express wrapper.
```

---

## Problem 3 — `buildTestApp` helper duplication

`RouteRegister_spec.js` and `RequestHandler_spec.js` both define a local `buildTestApp` helper.
The helpers have different signatures and wire up different classes (`RouteRegister` vs
`RequestHandler`), so they are **not true duplicates** and should stay in their respective files.
No change needed here.

---

## Files to Change

- `dev/app/spec/support/fixtures/expectedResponses.js` — new file; shared response constants
- `dev/app/spec/lib/Router_spec.js` — import shared constants; add scope comment
- `dev/app/spec/lib/RouteRegister_spec.js` — import shared constants
- `dev/app/spec/lib/RequestHandler_spec.js` — import shared constants
- `dev/app/spec/app_spec.js` — add scope comment only

## Expected outcome

- Response payloads are defined in one place; updating fixture data requires one file change.
- The distinction between `app_spec.js` and `Router_spec.js` is explicit and documented.
