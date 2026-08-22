# Rename HOW_TO_USE_NAVI.md and update references

Rename `docs/guides/HOW_TO_USE_NAVI.md` → `docs/guides/how_to_use_navi.md` (use `git mv` to preserve history), and update every internal reference to the old filename that falls within `docs`'s scope. Do not touch `docs/guides/HOW_TO_USE_NAVI-CLIENT.md` or `docs/guides/HOW_TO_USE_DEKU_SWARM.md` — only the exact `HOW_TO_USE_NAVI.md` filename is being renamed.

Known references to update (verified via `grep -rn "HOW_TO_USE_NAVI\.md"` at plan time — re-grep before editing in case something has moved):

- `README.md:35` — `[How to Use Navi in Your Project](.../docs/guides/HOW_TO_USE_NAVI.md)`
- `DOCKERHUB_DESCRIPTION.md:191` — same link pattern
- `source/README.md:210` — same link pattern
- `docs/guides/navi/prerequisites.md:107` — `[← Back to How to Use Navi](../HOW_TO_USE_NAVI.md)`
- `docs/guides/navi/paginated-actions.md:73` — same back-link pattern
- `docs/guides/navi/warming-html-assets.md:76` — same back-link pattern
- `docs/guides/navi/reference.md:69` — same back-link pattern
- `docs/guides/navi/option-a-docker-image.md:49` — same back-link pattern
- `docs/guides/navi/option-b-nodejs-image.md:56` — same back-link pattern
- `docs/guides/navi/option-c-circleci-executor.md:35` — same back-link pattern
- `docs/guides/navi/option-d-hosted-server.md:63` — same back-link pattern
- `docs/guides/navi/splitting-configuration.md:140` — same back-link pattern
- `docs/guides/navi-client/reference.md:15` — `[How to Use Navi](../HOW_TO_USE_NAVI.md)`

For each, replace `HOW_TO_USE_NAVI.md` with `how_to_use_navi.md` in the path — link text stays unchanged. Also check `how_to_use_navi.md`'s own content for any self-referential/anchor links using the old filename (unlikely, but verify).

Out of scope for this step (owned by `architect`, tracked separately): `.claude/agents/architect.md` and `.claude/agents/docs.md`.

## Files to Change

- `docs/guides/HOW_TO_USE_NAVI.md` → `docs/guides/how_to_use_navi.md` (rename).
- `README.md`, `DOCKERHUB_DESCRIPTION.md`, `source/README.md`, `docs/guides/navi/prerequisites.md`, `docs/guides/navi/paginated-actions.md`, `docs/guides/navi/warming-html-assets.md`, `docs/guides/navi/reference.md`, `docs/guides/navi/option-a-docker-image.md`, `docs/guides/navi/option-b-nodejs-image.md`, `docs/guides/navi/option-c-circleci-executor.md`, `docs/guides/navi/option-d-hosted-server.md`, `docs/guides/navi/splitting-configuration.md`, `docs/guides/navi-client/reference.md` — update the filename reference.
