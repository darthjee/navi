# Installation

```bash
npm install deku-swarm
```

## ES Modules only

`deku-swarm` is published as `"type": "module"` — it ships native ES Modules, not CommonJS. Consuming code must use `import`/`export` syntax, and relative imports within your own project need explicit `.js` extensions:

```js
// OK
import { Job } from 'deku-swarm';
import { MyJob } from './jobs/MyJob.js';

// Not supported: CommonJS require()
// const { Job } = require('deku-swarm');
```

If your project isn't already using ES Modules, add `"type": "module"` to your own `package.json` (or use the `.mjs` extension for the files that import `deku-swarm`).

## Node.js version

`deku-swarm` declares no `engines` constraint in its `package.json` — there is no explicit minimum version enforced by npm. Since the package relies on native ES Modules and standard modern JavaScript (private class fields, `crypto.randomUUID`), a current Node.js LTS release is recommended.

## Smoke test

Once installed, confirm the package resolves correctly by importing its full public surface:

```js
import {
  Job,
  JobFactory,
  JobRegistry,
  Worker,
  WorkerFactory,
  WorkersRegistry,
  Engine,
  WorkersAllocator,
  IdentifyableCollection,
  Queue,
  SortedCollection,
} from 'deku-swarm';
```

If that import succeeds with no error, you're ready to move on to [Defining Jobs](./defining-jobs.md).

[← Back to How to Use deku-swarm](../HOW_TO_USE_DEKU_SWARM.md)
