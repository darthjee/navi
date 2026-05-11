# Plan: Fix Links Endpoints

## Overview

Fix the `/links.json` endpoint, which crashes on every request due to a mismatch between how `HandlerConfig` spreads constructor parameters and how `LinksHandler` expects to receive its `links` argument.

## Context

`HandlerConfig` normalizes its `parameters` argument with `Array.isArray`: if it receives an array it treats each element as a separate constructor parameter; otherwise it wraps the value in an array. This works for handlers like `AssetsHandler` (which expects two separate arguments) but breaks for `LinksHandler`, where the single parameter _is_ an array of `Link` objects. As a result, `LinksHandler` always receives only the first `Link` (or `undefined`) instead of the full array, and `#allLinks()` throws a `TypeError` when it tries to spread it.

## Implementation Steps

### Step 1 — Fix the route registration in `Router.js`

Wrap `this.#webConfig.links` in an outer array so `HandlerConfig` treats it as a single parameter:

```js
// before
'/links.json': new HandlerConfig(LinksHandler, this.#webConfig.links),

// after
'/links.json': new HandlerConfig(LinksHandler, [this.#webConfig.links]),
```

`this.#parameters` will then be `[linksArray]`, and the handler will be instantiated as `new LinksHandler(req, res, linksArray)` — matching its constructor signature.

### Step 2 — Add specs covering the fixed behaviour

Extend or add a spec (in `source/spec/lib/server/handlers/LinksHandler_spec.js` or a `Router` integration spec) that exercises `LinksHandler` as it is actually constructed at runtime — i.e., via `HandlerConfig` — for the three meaningful cases:

- **No links configured** (`links = []`)
- **One link configured** (`links = [link1]`)
- **Multiple links configured** (`links = [link1, link2]`)

This ensures the bug cannot regress silently while the existing direct-instantiation specs remain valid.

## Files to Change

- `source/lib/server/Router.js` — wrap links in outer array on line 63
- `source/spec/lib/server/handlers/LinksHandler_spec.js` — add `HandlerConfig`-based specs for zero/one/many links

## Notes

- `HandlerConfig` itself is intentionally left unchanged; its current design is correct for all other handlers and the fix is local to the call site.
- The existing `LinksHandler_spec.js` tests instantiate the handler directly and will continue to pass; the new specs cover the integration path.
