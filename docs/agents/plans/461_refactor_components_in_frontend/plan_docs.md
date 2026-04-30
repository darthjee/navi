# Plan: Update Frontend Documentation

## Goal

Add a "Component conventions" section to `docs/agents/frontend.md` so future components are designed with the three-file pattern from the start.

## Implementation Steps

### Step 1 — Add "Component conventions" section to `frontend.md`

Insert a new section after the "Source layout" section documenting the three-file pattern:

```markdown
## Component conventions

Non-trivial components follow a three-file structure:

- `<Name>.jsx` — the component itself: `useState`, `useEffect`, `useMemo`, `useRef`, and delegation to Helper/View. No inline JSX beyond orchestration.
- `<Name>Helper.jsx` — HTML rendering helpers. Pure functions or a class with static/instance render methods. No data fetching or side effects.
- `<Name>View.jsx` — data manipulation logic: API calls, event handlers, derived state, effect builders. No JSX.

### When to apply

Apply the three-file split when a component has at least one of:
- Data fetching or polling (→ extract to View)
- Non-trivial HTML rendering (→ extract to Helper)

Trivial components that only compose other components or render a few elements (`CollapsibleSection`, `Layout`, `StatItem`, `JobStatItem`) do not need splitting.

### Reference implementation

`Jobs` / `JobsHelper` / `JobsView` is the canonical example of this pattern in the codebase.
```

### Step 2 — Update the source layout tree in `frontend.md`

Add the Helper and View files to the source layout `components/` block so the tree reflects the final state after the refactor.

## Files to Change

- `docs/agents/frontend.md` — add "Component conventions" section and update the source layout tree
