# Add MemoryHistoryClient

Add `frontend/src/clients/MemoryHistoryClient.js`, mirroring
`frontend/src/clients/EmissionsClient.js` / `LogsClient.js` exactly:

- `fetchMemoryHistory({ lastId } = {})` builds `/memory/history.json`, or
  `/memory/history.json?last_id=${encodeURIComponent(lastId)}` when `lastId` is set.
- `fetch(url).then(res => { if (!res.ok) throw new Error(\`HTTP ${res.status}\`); return res.json(); })`.
- Default-export `fetchMemoryHistory`.

## Files to Change

- `frontend/src/clients/MemoryHistoryClient.js` — new file, `fetchMemoryHistory`
  default export.
