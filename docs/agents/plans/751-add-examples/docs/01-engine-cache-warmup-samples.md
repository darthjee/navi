# Engine cache-warmup recipes

Create the six cache-warmup recipe files under `docs/guides/navi/samples/`, each following
the "Sample authoring conventions" in [../docs.md](../docs.md). The directory is new — the
first file creates it.

Each file's `## Configuration` block must be a complete `navi_config.yml` (clients +
resources + any `workers`/`failure`), followed by the run line
`npx navi-hey --config navi_config.yml`. `## What happens` traces behaviour with concrete
values. `## Notes` links the matching same-subtree feature guide.

- **`basic-warmup.md`** — minimal headless config: one `clients.default` with `base_url`, a
  small `resources` group listing flat `{ url, status: 200 }` entries, no `web:` key. "What
  happens": one job per URL; a non-200 is retried up to `workers.max-retries` (default 3)
  then goes dead; process exits 0 when the queue drains (no `failure.threshold`, so always
  0). Notes → `../prerequisites.md`, `../reference.md` (headless/CI).

- **`html-and-assets.md`** — warm HTML pages plus referenced CSS/JS. Config: `clients.default`
  + a second `clients.cdn` (own `base_url`, `headers`); a resource `url: /`, `status: 200`
  with an `assets:` list — `selector: 'link[rel="stylesheet"]'` / `attribute: href` and
  `selector: 'script[src]'` / `attribute: src`, one rule using `client: cdn`. "What happens":
  fetch `/`, parse HTML, extract asset URLs, resolve them (absolute / protocol-relative /
  root-relative per the `warming-html-assets.md` table), enqueue each as an independent job.
  Notes → `../warming-html-assets.md`.

- **`resource-chaining.md`** — warm every product-detail page from a product index, using a
  token-auth client for the detail calls. Config: `clients.default` + `clients.auth_api`
  (`headers.Authorization: Bearer $API_TOKEN`); `resources.products` `url: /products.json`,
  `actions: [{ resource: product_detail, parameters: { id: parsedBody.id } }]`;
  `resources.product_detail` `url: /products/{:id}.json`, `client: auth_api`. Explicitly call
  out `parsedBody` (camelCase). "What happens": fetch index → for each JSON array item
  extract `id` → enqueue `product_detail` with `{:id}` substituted, via `auth_api`.
  Notes → `../prerequisites.md` (actions, path expressions, the `parsedBody` warning).

- **`paginated-warmup.md`** — one request per page, forwarding `per_page` from a header,
  capped at the first two pages. Config: `resources.categories` `url: /categories.json` with
  `paginated_actions: [{ resource: products_page, pagination: [{ pages: parsedBody.pagination.pages }, { page_key: page }, { zero_indexed: false }], parameters: { per_page: headers['x-per-page'] } }]`;
  `resources.products_page` `url: /products/{:page}.json?per_page={:per_page}`, `status: 200`,
  `max_page: 2`. "What happens": given `{ pagination: { pages: 3 } }` + `X-Per-Page: 25`,
  pages 1–3 would fan out but `max_page: 2` on `products_page` caps to
  `/products/1.json?per_page=25` and `/products/2.json?per_page=25`. Notes →
  `../paginated-actions.md`; lowercase header keys; never name a `parameters` key `page`.

- **`split-config.md`** — a config split into an entry file plus an included file in another
  namespace, with a cross-namespace reference. Show two fenced blocks: `navi_config.yml`
  (entry, default namespace) with `include: [paginated_resources.yml]` and a
  `paginated_actions` targeting `resource: paginated_people`, `namespace: paginated`; and
  `paginated_resources.yml` with `namespace: paginated`, its `resources`, and an `actions`
  referencing `resource: person`, `namespace: default`. Run line passes only the entry file.
  "What happens": Navi loads entry + included files, merges per namespace, validates every
  reference eagerly at load, then runs; only the entry file contributes
  `workers`/`web`/`log`/`failure`. Notes → `../splitting-configuration.md`.

- **`ci-failure-threshold.md`** — a post-deploy warm run that fails the pipeline when too
  many jobs stay dead. Config: `workers: { quantity: 10, retry_cooldown: 2000, max-retries: 3 }`,
  `failure: { threshold: 10.0 }`, headless, a `resources` list. "What happens": engine
  processes all jobs; if `dead / total * 100 > 10.0` the process exits non-zero and the CI
  step fails, otherwise exit 0. Notes → `../prerequisites.md` (`failure.threshold` row),
  `../reference.md`.

## Files to Change

- `docs/guides/navi/samples/basic-warmup.md` — new recipe (creates the `samples/` dir).
- `docs/guides/navi/samples/html-and-assets.md` — new recipe.
- `docs/guides/navi/samples/resource-chaining.md` — new recipe.
- `docs/guides/navi/samples/paginated-warmup.md` — new recipe.
- `docs/guides/navi/samples/split-config.md` — new recipe.
- `docs/guides/navi/samples/ci-failure-threshold.md` — new recipe.
