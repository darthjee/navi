# Docker Plan: Wire up the downstream extension workflow end to end

Main plan: [plan.md](plan.md)

## Shared contracts

- Consume the `guide` project's `dist/` layout and `config/menu.yml` at the exact
  paths in plan.md › Shared contracts › "`dist/` layout ↔ compose mount".
- The `navi_extensions_app` service exposes port `3040:3000`; the
  `smoke-extensions` script asserts the three endpoints in plan.md › Shared
  contracts › "Smoke assertions".
- Canonical prod menu path `./config/menu.yml` → `/home/node/app/config/menu.yml`
  (plan.md › Shared contracts › "Canonical production menu path"); the
  derived-image Dockerfile and compose mount both target it.
- Env-var names/defaults `NAVI_EXTENSIONS_ENABLED` / `NAVI_EXTENSIONS_DIR` /
  `NAVI_MENU` match the rows `docs` adds to README / DOCKERHUB.
- The `smoke-extensions` CircleCI job name is what `architect` writes into the
  `docs/agents/contributing/commits-and-prs.md` CI-checks row.

## Steps

- [01 — Dev-container `navi-hey/extension` parity](docker/01-dev-dockerfile-parity.md)
- [02 — `navi_extensions_app` compose service + volume scaffold](docker/02-compose-service.md)
- [03 — Committed derived-image Dockerfile](docker/03-derived-image.md)
- [04 — `scripts/smoke/extensions.sh` + Makefile target](docker/04-smoke-script.md)
- [05 — `smoke-extensions` CircleCI job](docker/05-circleci-job.md)

## CI Checks

- root: `make smoke-extensions` (CI job: `smoke-extensions`).
- The existing `jasmine` / `checks` jobs are unaffected (no `source/` changes).

## Notes

- `navi_extensions_app` is the first compose service to actually run the Navi
  engine — it needs its own `command` (the dev image has no CMD).
- Compose does not deep-merge sequences: the service's `volumes:` must repeat all
  four `*base` mounts plus the two extension mounts.
- Always `docker compose down` after the smoke run (local target + CI job) — the
  compose project name defaults to `scylla` and would otherwise leak the
  container.
- Remove the stale commented extensions block on `navi_app` (superseded by the
  new service), but keep a one-line pointer comment to `docs/guides/navi/extending-navi.md`.
