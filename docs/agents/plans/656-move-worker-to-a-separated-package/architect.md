# architect Plan: Move worker to a separated package

Main plan: [plan.md](plan.md)

## Shared contracts

- Reads `worker/package.json`'s `version` field (produced by `engine`) in `scripts/bump_version.sh worker` and `scripts/check_worker_tag_version.sh` — must stay a plain semver string at that exact path.
- Documents the constructor injection contracts `engine` introduces (`Worker({ loggerFactory })`, `Engine({ allocator, jobRegistry, workersRegistry, sleepMs, keepAlive, idleTimeoutMs, onIdleTimeout })`, `WorkersAllocator({ jobRegistry, workersRegistry })`) in `docs/agents/worker.md`.
- The new `worker` agent's scope (`worker/`, all of it) must not overlap `engine`'s trimmed scope — the two together must still cover every file that used to be under `engine`.

## Steps

- [01 — Add worker CI jobs](architect/01-add-worker-ci-jobs.md)
- [02 — Add worker to bump_version.sh and tag-check scripts](architect/02-add-worker-scripts.md)
- [03 — Establish the worker agent and trim engine's scope](architect/03-establish-worker-agent-and-trim-engine.md)
- [04 — Update cross-cutting documentation](architect/04-update-cross-cutting-docs.md)
- [05 — Cut the first deku-swarm release](architect/05-cut-worker-first-release.md)

## Notes

- Steps 01–04 can be authored as soon as `engine`'s package shape (step 02/03 of `engine.md`) is settled — they don't need to wait for `engine`'s final commit, just its final file layout.
- Step 05 (tagging the release) is the very last step of the whole plan — it must wait until `engine`, `docker`, and `docs` have all landed and merged, since it triggers a real npm publish.
