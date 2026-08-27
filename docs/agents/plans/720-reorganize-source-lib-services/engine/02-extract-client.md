# Extract Client.js into source/lib/client

Move `Client.js` out of `services/` entirely into a new, dedicated
`source/lib/client/` folder (sibling of `source/lib/services/`), since it is
HTTP infrastructure rather than a business service. Use `git mv` to preserve
history.

`Client.js`'s own import of `RequestFailed.js` needs no change: both the old
location (`source/lib/services/Client.js`) and the new one
(`source/lib/client/Client.js`) sit two levels under `source/lib/`, so
`'../exceptions/request/RequestFailed.js'` still resolves correctly.

This step also fixes the one import left dangling by Step 01:
`source/lib/services/config/ConfigParser.js` (moved there in Step 01) still
imports `Client.js` via `'./Client.js'`; that path must become
`'../../client/Client.js'` now that `Client.js` lives at
`source/lib/client/Client.js`.

## Files to Change

- `source/lib/services/Client.js` → `source/lib/client/Client.js` — no internal import changes needed
- `source/lib/services/config/ConfigParser.js` — update `'./Client.js'` → `'../../client/Client.js'`
