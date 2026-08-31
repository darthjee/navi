# Engine crawling recipes

Create the three crawling recipe files under `docs/guides/navi/samples/`, following the
"Sample authoring conventions" in [../docs.md](../docs.md). "Crawling" here is the shipped
extraction + `emit` feature set — `actions` / `paginated_actions` parameter extraction plus
`emit` sending items onward — not the future dedicated crawler.

- **`emit-extracted-items.md`** — crawl a products endpoint and POST every product to an
  external endpoint. Config: `clients.default` + `clients.analytics_api`;
  `resources.products` `url: /products.json`, `status: 200`,
  `emit: { client: analytics_api, method: POST, url: /events, status: 202 }`. "What
  happens": for a body like `[ { "id": 1, "name": "Widget" }, { "id": 2, "name": "Gadget" } ]`,
  Navi sends each bare item as the POST body to `analytics_api` `/events`, expecting `202`,
  retrying up to `emit.retries` (default 5) with `emit.cooldown` (default 5000 ms) between
  attempts. Notes → `../emit-configuration.md`; `method` must be `POST`/`PUT`/`PATCH`.

- **`emit-body-template.md`** — same crawl, but wrap each item in an envelope. Config: the
  `emit` block above plus
  `body_template: { event: item.extracted, data: "{:.}" }` (optionally also show a
  single-field token such as `id: "{:id}"` and a nested `{:address.city}`). "What happens":
  item `{ "id": 1, "name": "Widget" }` → body
  `{ "event": "item.extracted", "data": { "id": 1, "name": "Widget" } }`. Explain: `{:.}` is
  the whole item with its type preserved; a token that is the entire string value splices the
  real typed value; a token inside a longer string is stringified; an unresolved token is
  left as literal `{:...}`. Notes → `../emit-configuration.md`.

- **`paginated-crawl-emit.md`** — crawl every page of a paginated listing and emit every item
  on every page. Config: `resources.listing` `url: /items.json` with
  `paginated_actions: [{ resource: items_page, pagination: [{ pages: parsedBody.pagination.pages }, { page_key: page }, { zero_indexed: false }] }]`;
  `resources.items_page` `url: /items.json?page={:page}`, `status: 200`, with its own
  `emit: { method: POST, url: /sink, status: 202 }`. "What happens": given
  `{ "pagination": { "pages": 3 } }`, Navi enqueues `items_page` for pages 1, 2, 3; each
  page response's items are each emitted to `/sink`. Note that `paginated_actions` and `emit`
  compose — the page fan-out happens first, then extraction + emit runs per page. Notes →
  `../paginated-actions.md`, `../emit-configuration.md`.

## Files to Change

- `docs/guides/navi/samples/emit-extracted-items.md` — new recipe.
- `docs/guides/navi/samples/emit-body-template.md` — new recipe.
- `docs/guides/navi/samples/paginated-crawl-emit.md` — new recipe.
