# Docs Plan: Wire up the downstream extension workflow end to end

Main plan: [plan.md](plan.md)

## Shared contracts

- Canonical prod menu path is `./config/menu.yml` (→ `/home/node/app/config/menu.yml`),
  which is what the production image already ships — the docs are wrong, not the
  image (plan.md › Shared contracts › "Canonical production menu path").
- The new env-var rows use the exact names/defaults in plan.md › Shared contracts
  › "New env-var rows", matching `docker`'s compose service and the prod
  Dockerfile.
- The `extending-navi.md` "Worked example" section is the fixed source of truth
  for the identifiers the `guide` project implements — keep prose and fixture
  byte-aligned; coordinate the final `devDependencies` block with `guide`.

## Steps

- [01 — Reconcile `NAVI_MENU` path in `extending-navi.md`](docs/01-extending-navi-menu-path.md)
- [02 — De-stale version pins + derived-image link in `extending-navi.md`](docs/02-extending-navi-versions.md)
- [03 — `configuring-the-menu.md` + SPEC-5 §6a menu path](docs/03-menu-guide-and-spec5.md)
- [04 — README + DOCKERHUB env-var rows](docs/04-readme-dockerhub.md)

## CI Checks

- `docs` changes have no dedicated CI job; the `checks` family lints code trees
  only. No command to run.

## Notes

- `docs/agents/future/downstream-extension-workflow.md` (SPEC-5) is transient
  design material deleted by CLEAN-1 (#807) — still fix its §6a `/navi/menu.yml`
  assumption so it does not mislead #806/#807 work in the meantime.
- Do not touch `docs/agents/folder-structure.md` or
  `docs/agents/contributing/commits-and-prs.md` — those rows are `architect`'s
  (architect.md step 2).
