# Architect Plan: Fix memory endpoint

Main plan: [plan.md](plan.md)

## Shared contracts

None — this is a documentation-only update to `docs/agents/frontend.md`
(owned by `architect`, not `frontend`, per `docs/agents/*` convention). It
describes files that already exist on disk regardless of whether
`frontend`'s `formatPercentage` work has landed yet.

## Implementation Steps

### Step 1 — Document the `MemoryStatus` page in `docs/agents/frontend.md`

The `MemoryStatus` page/route already exists in the codebase but was never
added to the docs. Update `docs/agents/frontend.md` in four places:

1. **Source layout** (the `frontend/` tree) — add under `components/pages/`:
   `MemoryStatus.jsx`, `MemoryStatus.css`, `controllers/MemoryStatusController.jsx`,
   `helpers/MemoryStatusHelper.jsx`; and under `clients/`: `MemoryStatusClient.js`.
2. **Routing table** — add a row:
   `| /memory/status | MemoryStatus | Memory usage and status |`
3. **Component hierarchy** — add `MemoryStatus` as a route under `<Outlet>`,
   alongside `Jobs` and `Job`:
   ```
   └── MemoryStatus     (route: /memory/status)
   ```
4. Follow the file's existing three-file-structure phrasing (`.jsx` /
   `helpers/` / `controllers/`) already used for `Jobs` — describe
   `MemoryStatus` the same way for consistency.

## Files to Change

- `docs/agents/frontend.md` — edit (source layout, routing table, component hierarchy)

## Notes

- Scope this strictly to the `MemoryStatus` page. `LogsPage.jsx` is also
  missing from the routing table in this same file, but that's a
  pre-existing, unrelated gap — do not fix it as part of this issue.
