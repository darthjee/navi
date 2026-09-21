# Add useFetchData hook
Create `dev/frontend/src/hooks/useFetchData.js` (new folder). Signature: `useFetchData(fetcher, deps)` returning `{ data, error, loading }`.

Behaviour (consolidating the four pages' current logic):
- initial state: `data = null`, `error = null`, `loading = true`
- inside `useEffect(..., deps)`: `setLoading(true)`, call `fetcher()`, on success `setData(data)` and `setError(null)`, on failure `setError(err.message)`, always `setLoading(false)` in `.finally`
- it is generic: it knows nothing about query strings, pagination or routing (the fetcher closes over whatever it needs)

Consider guarding against setting state after unmount / out-of-order responses only if the existing pages already do so (they do not) — keep behaviour identical, no new features.

Spec (`spec/hooks/useFetchData_spec.js`): render a tiny test component using the hook and cover loading, success, failure (error message surfaced) and refetch when a dep changes (loading returns to `true`, then data updates). Reuse the createRoot/`act`/`flushAsync` pattern from the page specs.

## Files to Change
- `dev/frontend/src/hooks/useFetchData.js` — new hook
- `dev/frontend/spec/hooks/useFetchData_spec.js` — new spec (`spec_files` glob `**/*[sS]pec.js` already picks it up)
