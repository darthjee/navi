# `GET /menu.json`: serializer, handler, Router wiring

Expose the loaded menu entries at a new `GET /menu.json`, modeled on the
`/links.json` triplet (`LinksSerializer` / `LinksHandler` / `Router` entry).
`/links.json` itself is not touched.

## `MenuSerializer`

`source/lib/serializers/MenuSerializer.js`, modeled on `LinksSerializer`:

```js
class MenuSerializer extends Serializer {
  static _serializeObject(entry) {
    return entry.toJSON(); // { route, text }
  }
}
```

## `MenuHandler`

`source/lib/server/handlers/MenuHandler.js`, modeled on `LinksHandler` but
simpler — there is no client-derived augmentation:

- `constructor(_request, response, entries)` — store `response` and `entries`.
- `handle()` — `this.#response.json({ entries: MenuSerializer.serialize(this.#entries) })`.
- extends `RequestHandler`.

## Router wiring

`source/lib/server/Router.js`:

- Constructor gains `menuConfig` alongside `webConfig`:
  `constructor({ webConfig = {}, menuConfig = [] } = {})`, stored in a private
  field.
- `build()` `GET_ROUTES` gains, next to the `/links.json` line:
  `'/menu.json': new HandlerConfig(MenuHandler, [this.#menuConfig])`.
- Import `MenuHandler`.

`menuConfig` here is the `MenuEntry[]` produced by step 02's loader; the value is
supplied by step 04's threading. A default of `[]` keeps existing `new Router({ webConfig })`
call sites and specs valid until step 04 updates them.

## Files to Change

- `source/lib/serializers/MenuSerializer.js` — new.
- `source/lib/server/handlers/MenuHandler.js` — new.
- `source/lib/server/Router.js` — import `MenuHandler`; add `menuConfig`
  constructor param + field; register `/menu.json` in `GET_ROUTES`.
- `source/spec/lib/serializers/MenuSerializer_spec.js` — new; mirror
  `LinksSerializer_spec.js` (single entry, array of entries).
- `source/spec/lib/server/handlers/MenuHandler_spec.js` — new; mirror
  `LinksHandler_spec.js` shape — responds with `{ entries: [...] }` for a given
  `MenuEntry[]`, empty list yields `{ entries: [] }`, works via `HandlerConfig`.
- `source/spec/lib/server/Router_spec.js` — add a case asserting `/menu.json`
  is registered and routes to `MenuHandler`; pass `menuConfig` through the
  constructor in the relevant example(s).
