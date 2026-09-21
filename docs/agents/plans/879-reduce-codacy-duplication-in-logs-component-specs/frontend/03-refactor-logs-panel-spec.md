# Refactor LogsPanel spec
Rewrite `frontend/spec/components/LogsPanel_spec.js`:

- replace the hand-rolled container/root setup with `useContainer()` and the inline `act` render with `renderInAct` from `support/dom.js`;
- switch to `logEntries` (message literals change from `'Started'`/`'Warning'` to the shared ones; adapt the assertions, don't weaken them) and reuse the shared-example function / `visibleLogRows` for the terminal container, empty state and per-level class checks;
- keep the panel-only assertions in the spec: one row per entry plus the sentinel div (`logs.length + 1`) and the `[2024-01-01T00:00:00Z]` bracketed timestamp format.

## Files to Change
- `frontend/spec/components/LogsPanel_spec.js` — use `useContainer`, shared fixture and shared examples; keep panel-only assertions
