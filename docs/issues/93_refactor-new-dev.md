# Refactor new-dev Application (#93)

Issue Link: https://github.com/darthjee/navi/issues/93

## Problem

`new-dev/app.js` mixes three distinct responsibilities in a single file and contains repeated logic:

**Duplications:**
- `categories.find((c) => c.id === Number(req.params.id))` appears in 3 route handlers
- `res.status(404).json({ error: 'Not found' })` appears 4 times (3 handlers + catch-all)

**Mixed responsibilities:**
- Data loading (`readFileSync` + `js-yaml`) lives alongside route definitions
- The Express app setup, routing logic, and persistence layer are all in one file

## Solution

Extract each responsibility into its own module under `new-dev/lib/`:

| File | Responsibility |
|------|---------------|
| `lib/data.js` | Loads and exports the categories dataset from `data.yml` |
| `lib/not_found.js` | Single `notFound(res)` helper for 404 responses |
| `lib/router.js` | Express Router with all category routes, using the helpers above |

`app.js` becomes a thin composition root: creates the Express app, mounts the router, and registers the catch-all.

## Acceptance Criteria

- [ ] `new-dev/lib/data.js` exports `categories` loaded from `data.yml`
- [ ] `new-dev/lib/not_found.js` exports `notFound(res)`
- [ ] `new-dev/lib/router.js` defines all four category routes using `findCategory` and `notFound`
- [ ] `new-dev/app.js` contains no inline data loading or repeated 404 logic
- [ ] All existing tests in `spec/app_spec.js` continue to pass unchanged
- [ ] `package.json` `c8` include and `report` script cover the new `lib/` directory
