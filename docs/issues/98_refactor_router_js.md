# Refactor router.js

## Context

`new-dev/lib/router.js` currently registers each Express route with a manually crafted
`steps` array passed directly to `DataNavigator`. For example:

```js
router.get('/categories/:id/items/:item_id.json', (req, res) => {
  const item = new DataNavigator(
    this._data, ['categories', Number(req.params.id), 'items', Number(req.params.item_id)]
  ).navigate();
  ...
});
```

Every route handler duplicates the same boilerplate: build the steps array by hand, call
`DataNavigator`, check for `null`, and respond. Adding new routes requires repeating this
pattern and knowing which URL segments map to numeric IDs.

## Goal

Introduce two new classes to remove this duplication and make route registration
declarative.

---

## Class 1 — `RouteParamsExtractor` (or similar name)

Derives the `DataNavigator` steps array automatically from a route template and the
Express `req.params` object.

**Responsibilities:**
- Receive a route pattern such as `'/categories/:id/items/:item_id.json'`
- Receive the `req.params` hash, e.g. `{ id: '3', item_id: '7' }`
- Strip the `.json` suffix from the last segment
- Split the path into segments
- For each segment:
  - If it is a named parameter (`:id`, `:item_id`, …), resolve its value from `req.params`
    and cast it to `Number`
  - Otherwise, keep it as a plain string key
- Return the resulting steps array, e.g. `['categories', 3, 'items', 7]`

**Example:**

```js
const extractor = new RouteParamsExtractor('/categories/:id/items/:item_id.json', { id: '3', item_id: '7' });
extractor.steps(); // => ['categories', 3, 'items', 7]
```

---

## Class 2 — `RouteRegistrar` (or similar name)

Wraps an `ExpressRouter` instance and registers a GET route given only the route pattern
and the data source.

**Responsibilities:**
- Receive an `ExpressRouter` instance and the application `data` object
- Expose a method (e.g. `register(route)`) that calls `router.get(route, handler)`
- Inside the handler, use `RouteParamsExtractor` to build the steps array from the route
  pattern and `req.params`
- Pass the steps to `DataNavigator` and navigate
- Return 404 via `notFound(res)` if the result is `null`; otherwise respond with `res.json(...)`

**Example:**

```js
const registrar = new RouteRegistrar(router, this._data);
registrar.register('/categories/:id.json');
registrar.register('/categories/:id/items/:item_id.json');
```

---

## Expected outcome in `Router#build`

After the refactor, `Router#build` should look roughly like:

```js
build() {
  const router = ExpressRouter();
  const registrar = new RouteRegistrar(router, this._data);

  registrar.register('/categories.json');
  registrar.register('/categories/:id.json');
  registrar.register('/categories/:id/items.json');
  registrar.register('/categories/:id/items/:item_id.json');

  return router;
}
```

No manual steps arrays, no repeated `DataNavigator` instantiation, and no duplicated
null-check boilerplate in `router.js`.

---

## Acceptance criteria

- [ ] `RouteParamsExtractor` correctly builds the steps array for all existing routes
- [ ] Numeric casting is applied to every named URL parameter (`:id`, `:item_id`, etc.)
- [ ] `RouteRegistrar` registers a working GET handler for each route
- [ ] All existing route specs continue to pass without modification
- [ ] Unit specs are added for `RouteParamsExtractor`
- [ ] Unit specs are added for `RouteRegistrar`
- [ ] `router.js` contains no manual steps arrays after the refactor
