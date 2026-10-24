# Docs Plan: Rename worker/ folder to deku-swarm/

Main plan: [plan.md](plan.md)

## Shared contracts

- New folder `deku-swarm/`, container path `/home/node/deku-swarm`, `bump_version.sh` target `deku-swarm`.
- Keep the README Versions-table row label `Worker (Deku Swarm)` unchanged (`bump_version.sh` matches it).

## Implementation Steps

### Step 1 — Update user-facing docs
- `README.md`: `deku-swarm` (`worker/`) becomes (`deku-swarm/`). In the bump instructions, `bump_version.sh worker [version]` becomes `bump_version.sh deku-swarm [version]`.
- `deku-swarm/README.md` (moved by the worker agent): the GitHub link `tree/main/worker` becomes `tree/main/deku-swarm`, and the "lives under `worker/`" text changes to match.
- `docs/guides/navi/option-e-development-image.md`: `-v $(pwd)/worker:/home/node/worker` becomes `-v $(pwd)/deku-swarm:/home/node/deku-swarm`.
- `docs/guides/deku-swarm/collections.md`: `worker/lib/generators/` becomes `deku-swarm/lib/generators/`.
- Grep `docs/guides/` and `DOCKERHUB_DESCRIPTION*.md` for any remaining folder-path mentions. Reword "the worker package" to `deku-swarm` where it means the folder.

## Files to Change
- `README.md`
- `deku-swarm/README.md`
- `docs/guides/navi/option-e-development-image.md`
- `docs/guides/deku-swarm/collections.md`

## Notes
- Concept wording ("worker pool", `Worker` class) stays.
