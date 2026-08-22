# MemoryStatusClient

Add the fetch wrapper for the new endpoint, mirroring `frontend/src/clients/StatsClient.js`'s shape exactly (a plain default-exported function doing `fetch(...).then(checkOk).then(normalize)`).

```js
const fetchMemoryStatus = () => {
  return fetch('/memory/status.json')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
};

export default fetchMemoryStatus;
```

No normalization/defaulting is needed here the way `StatsClient.js` does (`normalizeStats` merges in `DEFAULT_STATS` because `/stats.json` can omit nested keys) — the `/memory/status.json` contract is a flat, fully-specified object (`current`, `maximum`, `percentage`, `status`), so pass the parsed JSON straight through.

## Files to Change

- `frontend/src/clients/MemoryStatusClient.js` — new fetch wrapper as above.
- `frontend/spec/clients/MemoryStatusClient_spec.js` — new unit spec, mirroring however `StatsClient` (or a similar client) is tested: success response resolves with the parsed JSON as-is, non-OK response rejects with an `HTTP <status>` error.
