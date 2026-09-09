# `scripts/smoke/extensions.sh` + Makefile target

The assertion logic lives in a committed script; the Makefile target and the CI
job are thin wrappers around it (issue §6).

## What to do

`scripts/smoke/extensions.sh` (new dir `scripts/smoke/`) — `set -euo pipefail`,
polls `http://localhost:${SMOKE_PORT:-3040}` until the server answers (bounded
retry, ~30s), then asserts:

1. `GET /ext/orders/summary.json` → HTTP 200; body parsed (`jq` or `node -e`):
   `.service == "orders-extension"` and `(.pending | type) == "number"`.
2. `GET /extensions/frontend.json` → HTTP 200; `.bundles` is a non-empty array
   with an entry whose `.src` ends in `orders.js`.
3. `GET /menu.json` → HTTP 200; `.entries` contains an object
   `{ "route": "/ext/orders", "text": "Orders" }`.

Each failed assertion prints the offending response and `exit 1`. On success
print a one-line `OK`. Keep it dependency-light — `curl` + `jq` are available in
the CI `machine` executor; fall back to `node -e` for JSON if `jq` is not
guaranteed.

`Makefile` — new target next to `dev` / `tests`, and its name added to `.PHONY`:

```make
smoke-extensions: .env
	$(MAKE) build-dev
	cd examples/navi-orders-extension && npm ci && npm run build
	$(COMPOSE) up -d navi_extensions_app
	SMOKE_PORT=3040 bash scripts/smoke/extensions.sh; status=$$?; \
	  $(COMPOSE) down; exit $$status
```

(The `; status=$$?; ... down; exit $$status` idiom guarantees `compose down` runs
even when the smoke assertions fail.)

## Files to Change

- `scripts/smoke/extensions.sh` — new, executable.
- `Makefile` — `smoke-extensions` target + `.PHONY` entry.

## Notes

- `npm ci` here matches the example's toolchain (npm, not Yarn — see plan.md).
- The target depends on `.env` (the `.env:` file target creates it from
  `.env.sample`), same as `dev`.
