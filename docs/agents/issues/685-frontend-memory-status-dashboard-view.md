# Issue: Frontend: memory status dashboard view

## Description

Add a memory status view to the Navi dashboard SPA at `/#/memory/status`, showing current process memory usage against its configured maximum with color-coded status.

Part of the memory monitoring feature (#682). This sub-issue covers the frontend front only.

**Depends on:** the backend sub-issue (#684) that adds `GET /memory/status.json` — this work cannot start meaningfully until that endpoint exists (or at minimum, must be developed against its agreed contract below).

## Backend contract (already defined, do not change here)

`GET /memory/status.json` (unauthenticated) returns raw byte values:

```json
{
  "current": 89128960,
  "maximum": 20971520,
  "percentage": 25.2,
  "status": "low"
}
```

`status` is one of `low` / `medium` / `high` / `over`, derived by the backend from configured thresholds (upper bounds: low=25%, medium=50%, high=75%, over=100%). `percentage` is the raw `current / maximum * 100` value and is not clamped to 100 — it can exceed it when usage is above the configured maximum.

The page must:
- Convert `current` and `maximum` from bytes to human-readable units (MB/GB).
- Render a visual status indicator colored per the mapping below.
- Auto-refresh by re-fetching `GET /memory/status.json` on a 5-second interval while the view is active.

## Solution

- New SPA route `memory/status` (→ `/#/memory/status`), registered alongside the existing routes in `frontend/src/main.jsx` (inside the existing `Layout`/`Outlet` chrome, same as `logs`/`jobs`).
- New nav entry point: add a discoverable link to the page (e.g. a `StatItem` tile in `frontend/src/components/elements/StatsDisplay.jsx`, following the existing "Logs" tile pattern) — nothing currently links to `/memory/status`, so it must not be URL-only.
- New page component following the existing Controller/Helper/Client split convention used by comparable pages (see `StatsHeader.jsx` + `StatsHeaderController.jsx` + `StatsHeaderHelper.jsx`, or the `LogsPage.jsx` trio):
  - `frontend/src/components/pages/MemoryStatus.jsx` — the page component.
  - `frontend/src/components/pages/controllers/MemoryStatusController.jsx` — fetch + 5s polling (`setInterval`/`clearInterval` in `buildEffect()`, mirroring `StatsHeaderController`).
  - `frontend/src/components/pages/helpers/MemoryStatusHelper.jsx` — loading/error/success rendering.
  - `frontend/src/clients/MemoryStatusClient.js` — `fetch('/memory/status.json')` wrapper, mirroring `StatsClient.js`.
- New byte-formatting utility (no existing one — `frontend/src/utils/` currently only has `FilterParams.js` and `noop.js`) to convert `current`/`maximum` from bytes to human-readable MB/GB.
- New status-to-color mapping (e.g. `frontend/src/constants/memoryStatus.js`, mirroring `jobStatus.js`'s `VARIANT_BY_STATUS`). Bootstrap's built-in contextual variants don't cover this palette, so use custom colors:

  | Condition | Color |
  | :--- | :--- |
  | `status: "low"` (0–25%) | Dark gray |
  | `status: "medium"` (25–50%) | Green |
  | `status: "high"` (50–75%) | Yellow |
  | `status: "over"` (75–100%) | Red |
  | `percentage > 100%` (exceeds configured max; computed client-side from the raw `percentage` field, since the backend still reports `status: "over"` for this range) | Purple |

## Out of scope

- Any backend/config work (tracked separately in #684, must land first).
- README/DOCKERHUB documentation updates (tracked separately, once this and the backend sub-issue are done).
