# Architect Plan: Wire up the downstream extension workflow end to end

Main plan: [plan.md](plan.md)

## Shared contracts

Produce the `guide` agent and the `examples/` roster entries described in
plan.md › Shared contracts › "`guide` agent scope / roster". This work **must be
committed before any `Agent(guide)` dispatch** (plan.md › Bootstrap ordering).

## Implementation Steps

### Step 1 — Create the `guide` agent

Add `.claude/agents/guide.md`, mirroring the structure of the other agent files
(frontmatter keys `name`, `description`, `tools` only; `tools: Read, Edit, Write,
Bash`). Body sections: intro sentence, `## Your scope` (owns everything under
`examples/` — runnable worked-example projects that demonstrate consuming Navi;
each is a standalone package with its own toolchain, deliberately not bound by
Navi's Yarn rule), `## Out of scope` (do not touch `source/`, `frontend/`,
`worker/`, `dev/`, `dockerfiles/`, CI config — coordinate via architect),
`## Stack` (Node, npm for the example, Vite library build, Jasmine + jsdom +
esbuild specs), `## Commands` (`cd examples/<project> && npm ci && npm run build`,
`npm test`), `## Conventions` (SPEC-5 identifiers are fixed; keep the worked
example byte-aligned with `docs/guides/navi/extending-navi.md`).

Then add one row to the `## Specialist agents` table in `.claude/agents/architect.md`
(after the existing rows), format matching commit `cd90a5d`:

```
| `guide` | `examples/` — runnable worked-example projects that demonstrate building on top of Navi (extensions, derived images) |
```

### Step 2 — Register `examples/` in the structure + contributing docs

- `docs/agents/folder-structure.md` — add an `examples/` row to the "Project
  Root" table, describing it as the home of standalone worked-example projects
  (owned by `guide`), and note the first entry is `navi-orders-extension/`.
- `docs/agents/contributing/commits-and-prs.md` — add a row to the "CI Checks"
  table: modified folder `examples/navi-orders-extension/` → CircleCI job
  `smoke-extensions` → local command `make smoke-extensions`. This satisfies the
  file's own line 88 ("If a new container or application folder is added in the
  future, its corresponding test and check jobs must be run before merging").

## Files to Change

- `.claude/agents/guide.md` — new agent definition.
- `.claude/agents/architect.md` — one new row in the `## Specialist agents` table.
- `docs/agents/folder-structure.md` — `examples/` row in the Project Root table.
- `docs/agents/contributing/commits-and-prs.md` — `examples/` row in the CI
  Checks table naming the `smoke-extensions` job.

## Notes

- There is **no** `docs/agents/architecture/agent-roster-and-delegation.md`
  despite the issue text; do not create it — the two files above plus
  `.claude/agents/architect.md` are the whole roster surface.
- `AGENTS.md` has no agent table; only touch it if `examples/` gains a
  co-located index README worth listing in its "Module-level READMEs" table
  (optional, low value here).
