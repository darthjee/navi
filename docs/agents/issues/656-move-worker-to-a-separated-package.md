# Issue: Move worker to a separated package

## Description

The worker subsystem (documented in `docs/agents/worker.md` as a result of #653) is a cohesive, largely self-contained unit: `Worker`, `WorkerFactory`, `WorkersRegistry`, `WorkersRegistryInstance`, `Job` (abstract base), `JobFactory`, `JobRegistry`, `JobRegistryInstance`, `Engine`, `WorkersAllocator`, and the supporting collections (`IdentifyableCollection`, `Queue`, `SortedCollection`). It deserves to be its own package, published on npm as `deku-swarm`, following the same monorepo pattern already established by `clients/node/` (`navi-hey-client`).

The long-term goal is that any Node.js project can use `deku-swarm` as a generic queue-and-pool worker system, while Navi keeps its domain-specific `Job` subclasses, `ResourceEnqueuer`, engine auxiliary services, and `ApplicationInstance` — consuming `deku-swarm` as a dependency.

`worker/` will be a new top-level folder, owned by a new dedicated `worker` specialist agent (mirroring how `navi-client` owns `clients/node/`), rather than folded into `engine`'s existing scope.

## Problem

### What already works for extraction

- `Worker` and `WorkerFactory` receive `JobRegistry` and `WorkersRegistry` via constructor injection — already decoupled from Navi's static singletons.
- `Factory.js` is used only by `WorkerFactory` and `JobFactory` — no other Navi file imports it. It moves entirely with the package.
- `IdGenerator.js` is used only by the worker factories — moves entirely, along with `UUidGenerator.js` (verified: `IdGenerator` internally delegates to `UUidGenerator` and nothing else in Navi imports `UUidGenerator` directly, so it has to move alongside it).
- `ResourceEnqueuer` is already extracted as a dedicated Navi class that calls `JobRegistry.enqueue()` from outside.

### What needs refactoring before extraction

- `Engine` and `WorkersAllocator` call `JobRegistry` and `WorkersRegistry` as static methods (confirmed in `source/lib/services/Engine.js` and `WorkersAllocator.js`) — they need to receive these as injected instances instead.
- `Worker` imports `LogContext` directly from `../utils/logging/LogContext.js` — `LogContext` stays in Navi (it's Navi-specific logging), so `Worker` needs a logger factory injected instead.

## Solution

### Phase 0 — Refactor coupling (in `source/`, before the move)

Refactor `Engine` and `WorkersAllocator` to receive `JobRegistry` and `WorkersRegistry` as constructor-injected dependencies instead of static calls. Refactor `Worker` to receive a `loggerFactory` instead of importing `LogContext` directly.

| Class | Today (static) | After (injected) |
| --- | --- | --- |
| WorkersAllocator | `JobRegistry.pick()`, `JobRegistry.requeue()`, `WorkersRegistry.hasIdleWorker()`, `WorkersRegistry.getIdleWorker()` | Constructor: `{ jobRegistry, workersRegistry }` |
| Engine | `JobRegistry.promoteReadyJobs()`, `JobRegistry.hasReadyJob()`, `JobRegistry.hasJob()`, `WorkersRegistry.hasBusyWorker()` | Constructor: `{ allocator, jobRegistry, workersRegistry, sleepMs, keepAlive, idleTimeoutMs, onIdleTimeout }` |
| Worker | `import { LogContext } from '../utils/logging/LogContext.js'` + `new LogContext(...)` hardcoded | Constructor receives `loggerFactory`; `perform()` calls `this.#loggerFactory({ workerId, jobId })` |

`ApplicationInstance.buildEngine()` and `#initRegistries()` pass the injected dependencies. `LogContext` stays in Navi — `ApplicationInstance` wraps it as a factory and passes it to `WorkerFactory`.

Existing tests (`Engine_spec.js`, `Engine_async_spec.js`, `WorkersAllocator_spec.js`, `Worker_spec.js`) updated to pass dependencies via constructor in mocks. All existing tests must pass with no behavior change.

### Phase 1 — Create `worker/` package structure

Follow the `clients/node/` pattern:

```
worker/
├── package.json              # name: deku-swarm, version: 1.6.2, type: module
├── lib/
│   ├── index.js              # re-exports public API
│   ├── background/
│   │   ├── Worker.js
│   │   ├── WorkerFactory.js
│   │   ├── WorkersRegistry.js
│   │   ├── WorkersRegistryInstance.js
│   │   ├── Job.js
│   │   ├── JobFactory.js
│   │   ├── JobRegistry.js
│   │   └── JobRegistryInstance.js
│   ├── services/
│   │   ├── Engine.js
│   │   └── WorkersAllocator.js
│   ├── collections/
│   │   ├── Collection.js
│   │   ├── IdentifyableCollection.js
│   │   ├── Queue.js
│   │   ├── SortedCollection.js
│   │   ├── SortedArrayMerger.js
│   │   └── SortedArraySearcher.js
│   ├── Factory.js
│   └── generators/
│       ├── IdGenerator.js
│       └── UUidGenerator.js
├── spec/                     # mirrors lib/
├── eslint.config.mjs
├── yarn.lock
└── README.md
```

`worker/lib/index.js` re-exports all public classes:

```js
export { Worker } from './background/Worker.js';
export { WorkerFactory } from './background/WorkerFactory.js';
export { WorkersRegistry } from './background/WorkersRegistry.js';
export { Job } from './background/Job.js';
export { JobFactory } from './background/JobFactory.js';
export { JobRegistry } from './background/JobRegistry.js';
export { Engine } from './services/Engine.js';
export { WorkersAllocator } from './services/WorkersAllocator.js';
export { IdentifyableCollection } from './collections/IdentifyableCollection.js';
export { Queue } from './collections/Queue.js';
export { SortedCollection } from './collections/SortedCollection.js';
```

`worker/package.json`:

```json
{
  "name": "deku-swarm",
  "type": "module",
  "version": "1.6.2",
  "description": "Queue-based worker pool with retry, cooldown, and job chaining support",
  "main": "lib/index.js",
  "files": ["lib"],
  "scripts": {
    "spec": "npx jasmine --config=spec/support/jasmine.json",
    "test": "npx c8 jasmine --config=spec/support/jasmine.json",
    "coverage": "npm run test",
    "lint": "npx eslint lib spec",
    "report": "npx jscpd lib spec"
  }
}
```

First version: 1.6.2 (same as current Navi version).

### Phase 2 — Move code and tests

#### Source files moved

| From | To |
| --- | --- |
| source/lib/background/Worker.js | worker/lib/background/Worker.js |
| source/lib/background/WorkerFactory.js | worker/lib/background/WorkerFactory.js |
| source/lib/background/WorkersRegistry.js | worker/lib/background/WorkersRegistry.js |
| source/lib/background/WorkersRegistryInstance.js | worker/lib/background/WorkersRegistryInstance.js |
| source/lib/background/Job.js | worker/lib/background/Job.js |
| source/lib/background/JobFactory.js | worker/lib/background/JobFactory.js |
| source/lib/background/JobRegistry.js | worker/lib/background/JobRegistry.js |
| source/lib/background/JobRegistryInstance.js | worker/lib/background/JobRegistryInstance.js |
| source/lib/services/Engine.js | worker/lib/services/Engine.js |
| source/lib/services/WorkersAllocator.js | worker/lib/services/WorkersAllocator.js |
| source/lib/factory/Factory.js | worker/lib/Factory.js |
| source/lib/utils/collections/Collection.js | worker/lib/collections/Collection.js |
| source/lib/utils/collections/IdentifyableCollection.js | worker/lib/collections/IdentifyableCollection.js |
| source/lib/utils/collections/Queue.js | worker/lib/collections/Queue.js |
| source/lib/utils/collections/SortedCollection.js | worker/lib/collections/SortedCollection.js |
| source/lib/utils/collections/SortedArrayMerger.js | worker/lib/collections/SortedArrayMerger.js |
| source/lib/utils/collections/SortedArraySearcher.js | worker/lib/collections/SortedArraySearcher.js |
| source/lib/utils/generators/IdGenerator.js | worker/lib/generators/IdGenerator.js |
| source/lib/utils/generators/UUidGenerator.js | worker/lib/generators/UUidGenerator.js |

`UUidGenerator.js` was added to this table during discussion: `IdGenerator.js` delegates to it internally by default (`new UUidGenerator()`), and nothing else in Navi imports it directly, so it has to move alongside `IdGenerator.js` or the worker package will fail to resolve it after the move.

#### Spec files moved

| From | To |
| --- | --- |
| source/spec/lib/background/*_spec.js (5 files) | worker/spec/background/*_spec.js |
| source/spec/lib/services/Engine_spec.js | worker/spec/services/Engine_spec.js |
| source/spec/lib/services/Engine_async_spec.js | worker/spec/services/Engine_async_spec.js |
| source/spec/lib/services/WorkersAllocator_spec.js | worker/spec/services/WorkersAllocator_spec.js |
| source/spec/lib/factory/Factory_spec.js | worker/spec/Factory_spec.js |
| source/spec/lib/utils/collections/*_spec.js (15 files) | worker/spec/collections/*_spec.js |
| source/spec/lib/utils/generators/IdGenerator_spec.js | worker/spec/generators/IdGenerator_spec.js |
| source/spec/lib/utils/generators/UUidGenerator_spec.js | worker/spec/generators/UUidGenerator_spec.js |

#### Import adjustments inside worker

Internal imports adjusted to the new directory structure:

- WorkerFactory.js: `import { Factory } from '../factory/Factory.js'` → `import { Factory } from '../Factory.js'`
- JobRegistryInstance.js: `import { IdentifyableCollection } from '../utils/collections/...'` → `import { IdentifyableCollection } from '../collections/...'`
- Worker.js: `LogContext` import removed — logger injected via factory
- Engine.js and WorkersAllocator.js: static `JobRegistry`/`WorkersRegistry` imports removed — injected via constructor

#### What stays in Navi

| File | Reason |
| --- | --- |
| source/lib/jobs/*.js (5 subclasses) | Navi domain implementations — import `Job` from `deku-swarm` |
| source/lib/utils/ResourceEnqueuer.js | Navi-specific |
| source/lib/utils/HtmlParser.js, HtmlElementParser.js | Navi-specific |
| source/lib/utils/logging/LogContext.js | Stays in Navi — `Worker` receives logger via injected factory |
| source/lib/utils/generators/IncrementalIdGenerator.js | Stays in Navi — verified: used by `source/lib/common/utils/logging/LogFactory.js`, outside the worker subsystem |
| source/lib/services/EngineEvents.js | Injectable listener — stays in Navi |
| source/lib/services/EngineStopService.js | Injectable listener — stays in Navi |
| source/lib/services/FailureChecker.js | Injectable listener — stays in Navi |
| source/lib/services/RunSummary.js | Injectable listener — stays in Navi |
| source/lib/services/ApplicationInstance.js | Orchestrates boot, registers factories, imports from `deku-swarm` |

`source/lib/utils/index.js` was checked: it currently re-exports only `Logger`/`LoggerGroup`, not any of the moved collections, so it needs no change.

### Phase 3 — Navi consumes deku-swarm

#### `source/package.json` — file: dependency

```json
"dependencies": {
  "deku-swarm": "file:../worker"
}
```

This resolves locally in dev (Docker mount) and CI (git checkout has both directories) without needing the package on npm. Before npm publish of Navi, a CI step swaps this to `^1.6.2`.

#### Updated imports in Navi

```js
// Before:
import { Job } from '../background/Job.js';
import { JobFactory } from '../background/JobFactory.js';
import { JobRegistry } from '../background/JobRegistry.js';
import { WorkersRegistry } from '../background/WorkersRegistry.js';
import { Engine } from '../services/Engine.js';
import { WorkersAllocator } from '../services/WorkersAllocator.js';

// After:
import { Job, JobFactory, JobRegistry, WorkersRegistry, Engine, WorkersAllocator } from 'deku-swarm';
```

Files affected: `ResourceRequestJob.js`, `ActionProcessingJob.js`, `PaginatedActionProcessingJob.js`, `HtmlParseJob.js`, `AssetDownloadJob.js`, `ApplicationInstance.js`, `ActionEnqueuer.js`, `PaginatedActionEnqueuer.js`, `ResourceEnqueuer.js`, `server/handlers/engine/`, `serializers/`, and remaining specs.

#### Logger factory

`ApplicationInstance.#initRegistries()` creates a logger factory wrapping `LogContext`:

```js
const loggerFactory = ({ workerId, jobId }) => new LogContext({ workerId, jobId });
```

Passed to `WorkerFactory`, which injects it into each `Worker`.

### Phase 4 — Docker

#### `docker-compose.yml` — mount `worker/`

Add `./worker` volume to the base service (inherited by `navi_app` and `navi_tests`):

```yaml
base: &base
  image: navi:dev
  env_file: .env
  volumes:
    - ./source:/home/node/app
    - ./worker:/home/node/worker          # NEW
    - ./docker_volumes/config:/home/node/app/config
    - ./docker_volumes/node_modules:/home/node/app/node_modules
```

`file:../worker` in `source/package.json` resolves to `/home/node/worker/` — now mounted in the container.

### Phase 5 — CI (`.circleci/config.yml`)

#### New test/check jobs (parallel to client)

```yaml
jasmine-worker:
  docker:
    - image: darthjee/circleci_node:0.2.1
  steps:
    - checkout
    - run:
        name: Install dependencies
        command: cd worker; yarn install
    - run:
        name: Unit tests (Jasmine + c8 coverage)
        command: cd worker; npm run coverage
    - run:
        name: Upload coverage to Codacy (partial)
        command: cd worker; bash <(curl -Ls https://coverage.codacy.com/get.sh) report --partial -r coverage/lcov.info

checks-worker:
  docker:
    - image: darthjee/circleci_node:0.2.1
  steps:
    - checkout
    - run:
        name: Install dependencies
        command: cd worker; yarn install
    - run:
        name: Lint
        command: cd worker; npm run lint
    - run:
        name: Duplication report (JSCPD)
        command: cd worker; npm run report
```

#### Version check and publish jobs

```yaml
check-worker-version-tag:
  docker:
    - image: darthjee/circleci_node:0.2.1
  steps:
    - checkout
    - run:
        name: Check tag matches worker/package.json and README versions
        command: bash scripts/check_worker_tag_version.sh

npm-publish-worker:
  docker:
    - image: darthjee/circleci_node:0.2.1
  steps:
    - checkout
    - run:
        name: Check if version already exists on npm
        command: |
          VERSION=$(node -p "require('./worker/package.json').version")
          if npm view deku-swarm@$VERSION version 2>/dev/null; then
            echo "deku-swarm@$VERSION already exists on npm — skipping publish"
            circleci-agent step halt
          fi
    - run:
        name: Install dependencies
        command: cd worker; yarn install --frozen-lockfile
    - run:
        name: Publish to npm
        command: |
          echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
          cd worker; npm publish --access public
```

#### Swap step in Navi's npm-publish

Before npm publish in `source/`:

```yaml
- run:
    name: Replace local file dependency with npm version
    command: |
      sed -i 's/"deku-swarm": "file:..\//"deku-swarm": "^/' source/package.json
```

#### Cross-check before Navi release

New job that runs before `npm-publish` (Navi), checking if `worker/` changed since the last release:

```yaml
check-worker-changes:
  docker:
    - image: darthjee/circleci_node:0.2.1
  steps:
    - checkout
    - run:
        name: Check if worker/ changed since last release
        command: |
          LAST_TAG=$(git describe --tags --abbrev=0 --match='worker-*' --match='[0-9]*.[0-9]*.[0-9]*' 2>/dev/null || echo "")
          if [ -z "$LAST_TAG" ]; then
            echo "No previous release tag found — worker release recommended"
            exit 0
          fi
          if git diff --quiet "$LAST_TAG"..HEAD -- worker/; then
            echo "No changes in worker/ since $LAST_TAG — skipping"
            exit 0
          else
            echo "WARNING: worker/ has changes since $LAST_TAG"
            echo "A worker release (worker-x.y.z tag) should be created before or alongside this navi release"
            echo "Run: scripts/bump_version.sh worker [version]"
            exit 0
          fi
```

### Phase 6 — `bump_version.sh` and scripts

#### Add worker target

```bash
WORKER_PACKAGE_JSON="$ROOT_DIR/worker/package.json"

# Add to package_json_for():
worker) echo "$WORKER_PACKAGE_JSON" ;;

# Add bump_worker():
bump_worker() {
  sed -i '' "s|\"version\": \".*\"|\"version\": \"$VERSION\"|" "$WORKER_PACKAGE_JSON"
  if grep -q 'Worker Current Version:' "$README"; then
    sed -i '' "s|Worker Current Version:
\[.*\](https://github.com/darthjee/navi/releases/tag/worker-.*)|Worker Current Version:
[$VERSION](https://github.com/darthjee/navi/releases/tag/worker-$VERSION)|" "$README"
  else
    sed -i '' "/Client Next Version:/a\\
\\
Worker Current Version:
[$VERSION](https://github.com/darthjee/navi/releases/tag/worker-$VERSION)" "$README"
  fi
  if grep -q 'Worker Next Version:' "$README"; then
    sed -i '' "s|Worker Next Version:
\[.*\](https://github.com/darthjee/navi/compare/worker-.*)|Worker Next Version:
[$NEXT_VERSION](https://github.com/darthjee/navi/compare/worker-$VERSION...main)|" "$README"
  else
    sed -i '' "/Worker Current Version:/a\\
\\
Worker Next Version:
[$NEXT_VERSION](https://github.com/darthjee/navi/compare/worker-$VERSION...main)" "$README"
  fi
}
```

### Phase 7 — Agent boundaries and documentation

- Add a new `worker` specialist agent at `.claude/agents/worker.md`, scoped to everything inside `worker/`, following the `navi-client` agent as a template.
- Update `.claude/agents/engine.md`'s scope: remove `lib/background/`, `lib/services/Engine.js`/`WorkersAllocator.js`, `lib/factory/`, and the generator/collection utilities that moved out, since `engine` now consumes those from `deku-swarm` instead of owning them.
- AGENTS.md — add `worker/` in the folder structure table + a new Index entry (and reference the new `worker` agent).
- docs/agents/worker.md — update all paths from `source/lib/...` to `worker/lib/...`.
- docs/agents/folder-structure.md — add a `worker/` row in the table.
- docs/agents/flow/engine-and-workers.md — update path references + link to `worker.md`.
- README.md — add Worker Current Version / Worker Next Version badges.

### Phase 8 — First release

- `scripts/bump_version.sh worker 1.6.2` — set initial version
- Commit + push
- `git tag worker-1.6.2 && git push origin worker-1.6.2` — triggers `npm-publish-worker`
- CI checks npm if `deku-swarm@1.6.2` exists — if not, publishes
- Next Navi release: swap step replaces `file:../worker` → `^1.6.2` in published package.json

### Recommended commit sequence

| # | Commit | Phase |
| --- | --- | --- |
| 1 | refactor: inject JobRegistry/WorkersRegistry into Engine and WorkersAllocator | 0 |
| 2 | refactor: inject logger into Worker via factory | 0 |
| 3 | feat: create deku-swarm package structure and move worker code | 1+2 |
| 4 | feat: navi consumes deku-swarm as dependency | 3 |
| 5 | chore: mount worker volume in docker-compose | 4 |
| 6 | ci: add worker test, check, and publish jobs | 5 |
| 7 | chore: add worker target to bump_version and check scripts | 6 |
| 8 | docs: add worker agent, update agent boundaries and documentation | 7 |
| 9 | release: deku-swarm 1.6.2 | 8 |

### Out of scope

- No Docker image for the worker — it is a library package, not a CLI or service.
- No Yarn Workspaces restructuring — file: dependency + swap is the chosen approach.
- No automatic tag creation for worker releases — worker-x.y.z tags are created manually via `bump_version.sh worker`.

## Benefits

- Turns the worker system into a reusable, independently versioned open-source package (`deku-swarm`) that any Node.js project can depend on for generic queue-and-pool job processing.
- Forces a cleaner dependency-injection boundary in `Engine`/`WorkersAllocator`/`Worker`, reducing hidden coupling to Navi's static singletons even in the code that stays in Navi.
- Follows the proven `clients/node/` monorepo pattern, keeping versioning, CI, and publishing consistent across Navi's satellite packages, and giving `worker/` its own dedicated specialist agent just like `navi-client` has for `clients/node/`.
- No behavior change for Navi itself — existing tests keep passing, only imports move from local paths to `deku-swarm`.
