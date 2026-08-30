# Add ExtractionsClient and EmissionsClient

Two new pure-`fetch` client modules under `src/clients/`, following the `LogsClient.js` shape (relative URL, `.json` suffix, `?last_id=` when a cursor is given, `throw new Error(HTTP <status>)` on non-ok, return parsed JSON).

## EmissionsClient.js

```js
const fetchEmissions = ({ lastId } = {}) => {
  const url = lastId !== null && lastId !== undefined
    ? `/emissions.json?last_id=${encodeURIComponent(lastId)}`
    : '/emissions.json';
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
};
export default fetchEmissions;
```

Returns the raw `{ counts, emissions }` object (unlike `LogsClient`, which returns a bare array — the counts strip needs `counts`).

## ExtractionsClient.js

Same shape against `/extractions.json`, returning `{ counts, extractions }`.

## Files to Change

- `src/clients/EmissionsClient.js` — new.
- `src/clients/ExtractionsClient.js` — new.
