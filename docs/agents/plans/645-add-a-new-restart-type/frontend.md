# Frontend Plan: Add a new restart type

Main plan: [plan.md](plan.md)

## Shared contracts

Can rely on: `PATCH /engine/reload` — no request body; `200 { "status": "stopping" }` on success; `409 Conflict` when the engine isn't running. See [plan.md](plan.md)'s "Shared contracts" for the full rationale, including the button-visibility rule (`isRunning() || isPaused()`, matching Restart exactly).

## Implementation Steps

### Step 1 — Add `reloadEngine` to `EngineClient`

In `frontend/src/clients/EngineClient.js`, add a new function mirroring `restartEngine` exactly, and export it:

```js
const reloadEngine = () => {
  return fetch('/engine/reload', { method: 'PATCH' })
    .then(handleResponse);
};
```

Add `reloadEngine` to the file's `export` statement.

### Step 2 — Add a `ReloadButton` component

Create `frontend/src/components/elements/ReloadButton.jsx`, mirroring `RestartButton.jsx` (`frontend/src/components/elements/RestartButton.jsx`) exactly:

```jsx
function ReloadButton({ show, onClick }) {
  if (!show) return null;
  return (
    <button className="btn btn-sm btn-outline-primary" onClick={onClick}>
      Reload
    </button>
  );
}

export default ReloadButton;
```

### Step 3 — Wire `showReload`/`handleReload` into the controller

In `frontend/src/components/elements/controllers/EngineControlsController.jsx`:
- Import `reloadEngine` alongside the other `EngineClient` imports.
- Add `showReload() { return this.isRunning() || this.isPaused(); }` right next to `showRestart()` — same visibility rule as Restart (see [plan.md](plan.md)'s "Shared contracts" for why they must match).
- Add `handleReload() { this.handleAction(reloadEngine); }` right next to `handleRestart()`.

### Step 4 — Render the button

In `frontend/src/components/elements/helpers/EngineControlsHelper.jsx`:
- Import `ReloadButton` alongside `RestartButton`.
- Add a `renderReloadButton(view)` method mirroring `renderRestartButton(view)`:
  ```jsx
  renderReloadButton(view) {
    return <ReloadButton show={view.showReload()} onClick={() => view.handleReload()} />;
  }
  ```
- Call `{this.renderReloadButton(view)}` in `render()`, immediately after `{this.renderRestartButton(view)}`, so Reload appears right next to Restart in the button group.

## Files to Change

- `frontend/src/clients/EngineClient.js` — add and export `reloadEngine`.
- `frontend/src/components/elements/ReloadButton.jsx` — new file, mirrors `RestartButton.jsx`.
- `frontend/src/components/elements/controllers/EngineControlsController.jsx` — add `showReload()`/`handleReload()`.
- `frontend/src/components/elements/helpers/EngineControlsHelper.jsx` — import `ReloadButton`, add `renderReloadButton()`, call it after `renderRestartButton()`.
- `frontend/spec/clients/EngineClient_spec.js` — this file is table-driven (an array of `{ name, fn }` entries shared across `describe` blocks, `frontend/spec/clients/EngineClient_spec.js:53-54` shows the `restartEngine` entry); add a `{ name: 'reloadEngine', fn: reloadEngine }` entry to the same array so it picks up the existing "calls the correct endpoint" / "returns the expected result" / "throws on failure" cases automatically.
- `frontend/spec/components/EngineControls_spec.js` — add a "renders/does not render the Reload button" assertion next to every existing Restart assertion, in each state `describe` block (`running`, `paused`, `stopped`, `transitioning`) — Reload should be present/absent in exactly the same states as Restart.

## CI Checks

- `frontend`: `yarn install && npm run coverage` (CI job: `jasmine-frontend`) — Jasmine suite with coverage.
- `frontend`: `npm run lint` (CI job: `checks-frontend`) — ESLint.
- `frontend`: `npm run report` (CI job: `checks-frontend`) — JSCPD duplication report.

## Notes

- No visual/manual verification beyond the automated suite is planned here since this mirrors an existing, already-shipped button/action pair exactly (Restart) — same styling, same placement pattern, same client/controller/helper structure.
