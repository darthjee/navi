# Worker Plan: Rename worker/ folder to deku-swarm/

Main plan: [plan.md](plan.md)

## Shared contracts

- Produce: the folder at `deku-swarm/` (moved with `git mv`, history preserved). The package name `deku-swarm` and the version in `package.json` stay unchanged.
- Everyone else relies on the folder existing at `deku-swarm/` before they validate their changes.

## Implementation Steps

### Step 1 — Move the folder
Run `git mv worker deku-swarm`. Do not touch anything under `lib/` or `spec/`, and do not change `package.json`'s `version`. This is a rename-only PR, so the release checks have nothing to miss.

### Step 2 — Fix in-package path references
`deku-swarm/lib/README.md`: change the heading `# \`worker/lib/\`` to `# \`deku-swarm/lib/\``, and change the links to `docs/agents/worker.md` to point at `docs/agents/deku-swarm.md` (the architect renames that doc in the same PR). Edit nothing else: `deku-swarm/README.md` belongs to the `docs` agent.

## Files to Change
- `worker/` → `deku-swarm/` — `git mv`.
- `deku-swarm/lib/README.md` — heading and doc-link paths.

## CI Checks
- `deku-swarm`: `cd deku-swarm && npm run coverage` (CI job: `jasmine-deku-swarm`)
- `deku-swarm`: `scripts/ci.sh lint-and-report deku-swarm` (CI job: `checks-deku-swarm`)

## Notes
- `.gitignore`, `eslint.config.mjs` and `spec/support/jasmine.json` inside the folder use relative paths, so they need no change. Double-check with `grep -rn worker deku-swarm --include='*.json' --include='*.mjs' --include='.gitignore'`.
