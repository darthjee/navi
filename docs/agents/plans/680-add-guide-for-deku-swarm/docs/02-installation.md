# Installation sub-page

Create `docs/guides/deku-swarm/installation.md` covering:

- Installing from npm: `npm install deku-swarm`.
- ES Module requirements: the package is `"type": "module"` — consuming projects need `import`/`export` syntax with explicit `.js` extensions on relative imports (no CommonJS `require`).
- Node.js version constraints — check `worker/package.json`'s `engines` field (if present) and state the minimum supported version; otherwise note that no explicit constraint is declared and recommend a current LTS.
- A minimal "smoke test" import snippet, e.g. `import { Job, JobFactory, JobRegistry, WorkerFactory, WorkersRegistry, Engine } from 'deku-swarm';`, to confirm the install worked before moving on to [Defining Jobs](./defining-jobs.md).

## Files to Change

- `docs/guides/deku-swarm/installation.md` — new sub-page.
