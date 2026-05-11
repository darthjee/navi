# Issue: Fix Links Endpoints

## Description

The `/links.json` endpoint always crashes when called. The root cause is in how `Router.js` registers `LinksHandler` via `HandlerConfig`: `this.#webConfig.links` is itself an array of `Link` objects, which `HandlerConfig` misidentifies as a list of separate parameters and spreads them individually into the constructor — so `LinksHandler` receives only the first `Link` as its `links` argument instead of the full array.

## Problem

In `Router.js` (`source/lib/server/Router.js:63`):
```js
'/links.json': new HandlerConfig(LinksHandler, this.#webConfig.links)
```

`HandlerConfig` (`source/lib/common/server/HandlerConfig.js:16`) does:
```js
this.#parameters = Array.isArray(parameters) ? parameters : [parameters];
```

Since `this.#webConfig.links` is an array, `Array.isArray` returns `true` and the links are stored as individual entries in `#parameters`. Then on each request:
```js
new LinksHandler(req, res, ...this.#parameters)
// becomes: new LinksHandler(req, res, link1, link2, ...)
```

`LinksHandler`'s constructor only captures the third argument as `links`:
```js
constructor(_request, response, links) { this.#links = links; }
```

So `this.#links` ends up being a single `Link` object (or `undefined` when there are no links). When `#allLinks()` tries to spread it:
```js
return [...this.#links, ...this.#clientLinks()];
```
it throws a `TypeError` because a `Link` object is not iterable.

## Expected Behavior

- `/links.json` must return the correct JSON response regardless of how many links are configured (zero, one, or many).

## Solution

Wrap the links array in an outer array when registering the route in `Router.js`:

```js
'/links.json': new HandlerConfig(LinksHandler, [this.#webConfig.links])
```

This makes `this.#parameters = [linksArray]`, so the handler is called as:
```js
new LinksHandler(req, res, linksArray)
```
and `this.#links` correctly receives the full array.

Add a spec for `LinksHandler` via `HandlerConfig` (or extend the `Router` integration spec) covering zero, one, and multiple configured links to prevent regression.

## Benefits

- Fixes a silent regression: the endpoint has been broken for all configurations with a `links` section.
- Keeps the fix minimal and local — `HandlerConfig`'s existing design is preserved for all other handlers.

---
See issue for details: https://github.com/darthjee/navi/issues/586
