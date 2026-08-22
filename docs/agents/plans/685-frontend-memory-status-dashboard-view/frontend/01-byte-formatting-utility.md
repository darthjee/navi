# Byte-formatting utility

No byte-formatting helper exists yet in this codebase (`frontend/src/utils/` currently only has `FilterParams.js` and `noop.js`). Add a small pure function that converts a raw byte count (as returned by `current`/`maximum` in the backend response) into a human-readable string in MB/GB.

Keep it simple and dependency-free:
- Accepts a non-negative number of bytes.
- Picks the largest unit (B, KB, MB, GB) where the value is `>= 1` in that unit — mirroring common `1024`-based conversions (not `1000`-based), matching how OS/process memory figures (RSS) are usually read.
- Formats with a small number of decimal places (e.g. 1–2) — exact formatting is an implementation detail, no need to match a specific existing convention since none exists yet.
- No locale/i18n handling needed — this app has no such precedent.

Write it as a plain exported function, matching the style of the other `frontend/src/utils/*.js` files (no class wrapper needed here, unlike the Controller/Helper pattern used for page-level fetch/render logic).

## Files to Change

- `frontend/src/utils/formatBytes.js` — new pure function, e.g. `formatBytes(bytes)` returning a string like `"85.0 MB"`.
- `frontend/spec/utils/formatBytes_spec.js` — new unit spec covering: 0 bytes, values that land in each unit tier (B/KB/MB/GB), and a value at/near a unit boundary (e.g. exactly `1024`).
