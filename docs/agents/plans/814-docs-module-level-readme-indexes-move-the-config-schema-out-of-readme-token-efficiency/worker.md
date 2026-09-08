# Worker Plan: Docs: module-level README indexes + move the config schema out of README (token efficiency)

Main plan: [plan.md](plan.md)

## Shared contracts

- Create **`worker/lib/README.md`** — a terse index of the immediate children of
  `worker/lib/` only (4 subfolders + 2 flat files), one line each, plus a "See also" link
  to `../../docs/agents/worker.md`. No recursion into nested dirs.
- `architect` adds the reverse link from `docs/agents/worker.md` back to
  `worker/lib/README.md` — not this agent.
- Do not touch `worker/README.md` (the `deku-swarm` npm package readme) — it carries no
  Navi config schema and is out of scope for this issue.

## Implementation Steps

### Step 1 — Create `worker/lib/README.md`

One line per immediate child of `worker/lib/`. Current entries and suggested descriptions
(refine against the code):

- `background/` — the queue-and-pool core: `Job`, `Worker`, their `*Factory` and
  `*Registry` / `*RegistryInstance` classes.
- `collections/` — internal storage primitives: `Collection`, `IdentifyableCollection`,
  `Queue`, `SortedCollection`, `SortedArrayMerger`, `SortedArraySearcher`.
- `generators/` — id generators: `IdGenerator`, `UUidGenerator`.
- `services/` — `Engine` (the main loop) and `WorkersAllocator` (matches ready jobs to
  idle workers).
- `Factory.js` — generic object-builder base class extended by `JobFactory` /
  `WorkerFactory`.
- `index.js` — package entry point; the public `deku-swarm` export surface.

End with:

```markdown
## See also

[`docs/agents/worker.md`](../../docs/agents/worker.md) — the class-by-class reference for `deku-swarm` and how `source/` consumes it.
```

Keep it lean — internal navigation aid, not the published package readme.

## Files to Change

- `worker/lib/README.md` — **new**: one-line-per-child index of `worker/lib/`, "See also" →
  `../../docs/agents/worker.md`

## CI Checks

- `worker`: `checks-worker` runs `scripts/ci.sh lint-and-report worker` (ESLint + JSCPD).
  Confirm `worker/eslint.config.mjs` targets `.js` only; if its `files` glob is broad, add
  `**/*.md` to `ignores`. `jasmine-worker` is unaffected.
- `check-and-publish-worker` runs only on release tags and diffs `worker/` to decide
  whether to publish — adding `worker/lib/README.md` will count as a `worker/` change, but
  that only affects release-time publish decisions, not this PR.

## Notes

- Immediate children only; nested detail (e.g. every class under `background/`) lives in
  `docs/agents/worker.md`, which the index links to.
