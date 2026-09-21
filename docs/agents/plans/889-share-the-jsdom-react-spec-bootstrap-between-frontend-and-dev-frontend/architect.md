# Architect Plan: Share the jsdom/React spec bootstrap between frontend and dev/frontend

Main plan: [plan.md](plan.md)

## Shared contracts

Owns the package definition (name `navi-spec-support`, folder `spec-support/`, `exports` map, peer dependencies) exactly as in [plan.md](plan.md#shared-contracts). Other agents rely on the package existing with those specifiers before they migrate.

## Steps

- [01 — Create the spec-support package](architect/01-create-spec-support-package.md)
- [02 — Create the spec-support agent and update agent scopes](architect/02-create-spec-support-agent.md)
- [03 — Root config and documentation](architect/03-root-config-and-docs.md)

## Notes
- There is no `spec-support` agent yet, so the architect creates the package files (step 01) before the agent exists; once step 02 lands, later changes to the folder belong to that agent.
- `architect` is normally the coordinator and excluded from agent splits; it is included here because the root-level folder, agent definition and root config files have no other owner.
- Lint coverage: `frontend/spec/support/**` was linted by `frontend`'s ESLint config; after the move the shared files sit outside both packages' ESLint scope. Decide during step 01 whether to add a minimal `eslint.config.mjs` to `spec-support/` (would also need a CI job) or accept no lint; do not add a CI job without raising it.
- Codacy already excludes `frontend/spec/` and `dev/frontend/spec/`; the new folder must be excluded the same way (step 03).
