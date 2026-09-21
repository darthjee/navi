# Root config and documentation
Update root-level configuration and the agent documentation for the new folder.

- `.codacy.yaml`: add `spec-support/` to `exclude_paths` (test-support code, like `frontend/spec/` and `dev/frontend/spec/`).
- `docs/agents/spec-support.md`: new doc — purpose, the package contract (exports table), how frontends consume it (`file:` dependency, install-time compose mounts, reinstall after edits), how the `navi-hey-test` image reuses it, and who owns it.
- `AGENTS.md`: add a row for `spec-support/` to the folder table (next to `worker/`, line ~72) and to the documentation table (next to the `Worker Subsystem` row).
- `docs/agents/folder-structure.md`: add `spec-support/` to the project-root table.
- `docs/agents/frontend.md` and `docs/agents/dev-app.md`: short note under the spec/test sections that the jsdom/React bootstrap comes from `navi-spec-support`, with a link to the new doc and the one-time `yarn install` after pulling.
- Update references to `frontend/spec/support/{dom,loader,transform_hooks}.js` in `docs/agents/` if any remain (`docs/agents/client-node.md` mention of `spec/support` is unrelated — leave it).
- `docs/agents/issues/887-*.md`: no change needed beyond confirming it still defers to #889.

## Files to Change
- `.codacy.yaml` — exclude `spec-support/`
- `docs/agents/spec-support.md` — new
- `AGENTS.md` — folder and docs tables
- `docs/agents/folder-structure.md` — root table
- `docs/agents/frontend.md`, `docs/agents/dev-app.md` — cross-references
