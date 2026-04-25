# Part 4 — Documentation

## Goal

Document the frontend build workflow and the static-serving behaviour for both developers and end users.

## Steps

- Update `docs/agents/architecture.md` — add `IndexRequestHandler` and `AssetsRequestHandler` to the `server/` module table; describe `source/static/` layout.
- Update `docs/agents/flow.md` — describe the static-file serving routes.
- Update `docs/agents/contributing.md` (or equivalent) — add instruction that frontend code changes require a `yarn build` inside the frontend container to update `source/static/`.
- Update `README.md`, `DOCKERHUB_DESCRIPTION.md`, and `source/README.md` — mention that the package includes the frontend and document the build step.

## Files to Change

- `docs/agents/architecture.md`
- `docs/agents/flow.md`
- `docs/agents/contributing.md`
- `README.md`
- `DOCKERHUB_DESCRIPTION.md`
- `source/README.md`
