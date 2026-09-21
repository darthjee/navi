# Rollout

The seven sub-issues of #888, in order:

| # | Issue | What | Depends on |
|---|---|---|---|
| 1 | #911 | Write these specs and migrate `docs/agents/future/` to `docs/agents/specs/`. | - |
| 2 | #912 | Create the `logger` agent and the `logger/` folder. | #911 |
| 3 | #913 | Scaffold the package (`package.json`, lint, jasmine, docs). | #912 |
| 4 | #914 | Extract the shared logging classes and their specs into the package. | #913 |
| 5 | #915 | CI and release flow, ending with the first npm publish. | #914 |
| 6 | #916 | Link `source/`, `clients/node/` and `dev/app`, update Dockerfiles and compose, delete the old copies. | #914 and #915 |
| 7 | #917 | Delete `docs/agents/specs/deku-sprout*`. | all the others |

## Ordering constraints

- CI and publish (#915) must land before the client links to the package (#916): the published package has to exist on npm, because `navi-hey-client` consumers install from the registry.
- #917 is last. It removes only the `deku-sprout` specs: the `docs/agents/specs/` folder and its `AGENTS.md` entry are permanent and must stay.
