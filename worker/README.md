# deku-swarm

Queue-based worker pool with retry, cooldown, and job chaining support.

This package is being extracted from [Navi](https://github.com/darthjee/navi)'s
job/worker engine (`source/lib/background/`, `source/lib/services/Engine.js`,
`source/lib/services/WorkersAllocator.js`) into a standalone, reusable module.

Status: work in progress, not yet published to npm. Navi currently consumes it
as a local `file:` dependency (`"deku-swarm": "file:../worker"`).

## Development

```bash
yarn install
yarn spec       # run the test suite
yarn coverage   # run the test suite with coverage
yarn lint       # run eslint
yarn report     # run jscpd duplication analysis
```
