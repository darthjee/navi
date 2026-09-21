# Write `rollout.md` and `decisions.md`
Both files go in `docs/agents/specs/deku-sprout/`.

**`rollout.md`** — the seven sub-issues of #888 in order, with dependencies:
1. #911 — write these specs and migrate `future/` to `specs/`
2. #912 — create the `logger` agent and the `logger/` folder
3. #913 — scaffold the package (package.json, lint, jasmine, docs)
4. #914 — extract the shared logging classes and specs into the package
5. #915 — CI and release flow, ending with the first npm publish (must land before the client links)
6. #916 — link `source/`, `clients/node/` and `dev/app`, update Dockerfiles/compose, delete the old copies (depends on #914 and #915)
7. #917 — last: delete `docs/agents/specs/deku-sprout*` (the `specs/` folder and its `AGENTS.md` entry stay); depends on all the others

**`decisions.md`** — each decision with its rationale:
- Extract now, into a new package (approach A); putting the code in `deku-swarm` (B) rejected as an unrelated concern in a queue/worker package, keeping both copies (C) rejected because the copies would stay manually synchronised.
- Public on npm: `navi-hey-client` consumers install from the registry, where a `file:` dependency cannot resolve; a private registry would need credentials for every client user, and a `private: true` package (like `navi-spec-support`) would need bespoke bundling in the client's release.
- Name `deku-sprout`, unscoped like `deku-swarm`; `deku-tree`, `sheikah` and `hylia` are taken on npm.
- `Logger` and `LoggerGroup` included: the four classes only depend on each other, and the client using the group-aware `Logger` removes all three duplicated files.
- `dev/app` is a consumer too (it only imports `Logger`).
- The client gains a runtime dependency and stops being self-contained: accepted as the price of removing the duplication.
- Owner: a new `logger` agent mirroring `worker`; folder `logger/`.
- `docs/agents/specs/` replaces `docs/agents/future/` and is permanent; only the `deku-sprout` specs are temporary.

## Files to Change
- `docs/agents/specs/deku-sprout/rollout.md` — new
- `docs/agents/specs/deku-sprout/decisions.md` — new
