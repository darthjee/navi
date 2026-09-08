# Frontend Plan: Docs: module-level README indexes + move the config schema out of README (token efficiency)

Main plan: [plan.md](plan.md)

## Shared contracts

- Create **`frontend/src/README.md`** — a terse index of the immediate children of
  `frontend/src/` only, one line each, plus a "See also" link to
  `../../docs/agents/frontend.md`. No recursion into nested dirs.
- `architect` adds the reverse link from `docs/agents/frontend.md` back to
  `frontend/src/README.md` — not this agent.

## Implementation Steps

### Step 1 — Create `frontend/src/README.md`

One line per immediate child of `frontend/src/`. Current entries and suggested descriptions
(refine against the code — note `docs/agents/frontend.md`'s source-layout tree is slightly
behind, e.g. it omits `utils/`):

- `main.jsx` — React entrypoint; hash-router setup and route table.
- `clients/` — pure `fetch` API client modules, one per backend endpoint (`StatsClient`,
  `JobsClient`, `JobClient`, `EngineClient`, `MemoryStatusClient`, `EmissionsClient`,
  `ExtractionsClient`).
- `components/` — React components: `pages/` (route-level) and `elements/` (reusable
  widgets), each non-trivial one split into `<Name>.jsx` + `controllers/` + `helpers/`.
- `constants/` — shared constant maps (e.g. `jobStatus.js`: status → Bootstrap colour
  variant).
- `utils/` — pure helpers: `FilterParams`, `formatBytes`, `formatPercentage`,
  `formatTimestamp`, `noop`.

End with:

```markdown
## See also

[`docs/agents/frontend.md`](../../docs/agents/frontend.md) — the full frontend reference: stack, routing, component conventions, build.
```

Keep it lean.

## Files to Change

- `frontend/src/README.md` — **new**: one-line-per-child index of `frontend/src/`,
  "See also" → `../../docs/agents/frontend.md`

## CI Checks

- `frontend`: `checks-frontend` runs `scripts/ci.sh lint-and-report frontend` (ESLint).
  Confirm `frontend/eslint.config.js` targets `.jsx`/`.js` only; if its `files` glob is
  broad, add `**/*.md` to `ignores`. `jasmine-frontend` is unaffected.
- Vite only bundles modules reachable from an entry — a stray `README.md` in `src/` is not
  imported and will not be bundled into `source/static/`.

## Notes

- Immediate children only; per-component detail stays in `docs/agents/frontend.md`, which
  the index links to.
