# Status-to-color constant

Add the memory-status color mapping agreed in the issue, mirroring the existing `frontend/src/constants/jobStatus.js` convention (a plain exported map keyed by the domain status string):

| Condition | Color |
| :--- | :--- |
| `status: "low"` (0–25%) | Dark gray |
| `status: "medium"` (25–50%) | Green |
| `status: "high"` (50–75%) | Yellow |
| `status: "over"` (75–100%) | Red |
| `percentage > 100%` (client-computed override) | Purple |

Unlike `jobStatus.js`'s `VARIANT_BY_STATUS` (which maps directly to Bootstrap's built-in `text-bg-*` contextual variants: `secondary`/`primary`/`danger`/`success`/`dark`), Bootstrap has no built-in "orange"/generic-purple contextual variant, and this palette doesn't line up with the built-in variants anyway (e.g. "low" → dark gray, not `success`). So this constant should map status to a small custom CSS class (or inline hex) instead of a Bootstrap variant name — add the handful of custom color rules as a small stylesheet (following the `LogsPage.css` precedent, the app's one example of a plain hand-written CSS file) rather than trying to force Bootstrap's `text-bg-*` utilities to fit.

The `percentage > 100%` → purple case is not a distinct backend `status` value (backend still reports `status: "over"` there) — expose a helper function here (not just a static map) that takes both `status` and `percentage` and returns the right color, so callers don't have to duplicate that one piece of override logic.

## Files to Change

- `frontend/src/constants/memoryStatus.js` — new constant(s) + a `colorForMemoryStatus(status, percentage)` (or similarly named) helper function implementing the table above, including the `percentage > 100` override.
- `frontend/src/components/pages/MemoryStatus.css` — new small stylesheet defining the custom color classes referenced by the constant above (dark gray / green / yellow / red / purple), imported directly by the page component (see step 05).
- `frontend/spec/constants/memoryStatus_spec.js` — new unit spec covering all 5 conditions, including the boundary at `percentage === 100` (still red) vs. `percentage > 100` (purple).
