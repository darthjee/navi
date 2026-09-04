# Add recharts dependency

Add `recharts` as a runtime dependency via **Yarn** (`yarn add recharts` —
`npm install` is forbidden in this repo). This is a deliberate exception:
the frontend currently has no charting library and no SVG/canvas rendering
anywhere (see #761's discussion).

## Files to Change

- `frontend/package.json` — add `recharts` to `dependencies`.
- `frontend/yarn.lock` — updated by `yarn add`.
