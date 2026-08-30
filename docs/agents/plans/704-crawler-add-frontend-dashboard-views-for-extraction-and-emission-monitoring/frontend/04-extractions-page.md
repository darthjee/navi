# Add the /extractions page view

A dedicated route showing the per-crawl chain `resource (origin URL) → parser type → items extracted → emits sent → emit status`, by joining `/extractions.json` with `/emissions.json` on `extractionId`.

## Route

`src/main.jsx` — import `Extractions` and add `<Route path="extractions" element={<Extractions />} />` inside the `Layout` route.

## Components

- `src/components/pages/Extractions.jsx` — `MemoryStatus.jsx` skeleton (`data`, `error`, `loading`).
- `src/components/pages/controllers/ExtractionsController.jsx`:
  - On an interval (~5000 ms, like `MemoryStatusController`), fetch **both** `fetchExtractions()` and `fetchEmissions()` (no cursor — full current buffers), then build a joined view model:
    - Group emissions by `extractionId`. For each extraction record, compute `emitsSent = group.length`, and a status breakdown `{ success, failed, dead }` from `emission.status`.
    - `emitsExpected` is unknown from the API (an extraction's items may have no `emit` config); show `emitsSent` against `itemCount` as "N of M items emitted" and let it be less than `itemCount`.
    - Mark a row `partial: true` when the emission buffer looks truncated (e.g. the oldest retained emission id is greater than the smallest `extractionId` in view) so the helper can show a "counts may be incomplete" hint.
  - Keep `counts.extracted` from the extractions response for a headline stat.
- `src/components/pages/helpers/ExtractionsHelper.jsx`:
  - `renderLoading()` / `renderError()`.
  - `render({ extractedTotal, rows })`: a headline `extracted` stat + a `table table-striped`:
    - **Time** (`timestamp`), **Resource** (`originUrl ?? '—'`, `font-monospace`), **Parser** (`parserType` badge), **Items** (`itemCount`), **Emits sent** (`emitsSent`, with a `partial` hint when set), **Emit status** (three small badges: `success` / `failed` / `dead` counts, hidden when zero).
  - Empty state: "No extractions recorded yet."

## Navigation

`src/components/elements/StatsDisplay.jsx` already links `Extracted → /extractions` (step 02). No extra nav entry needed; optionally add a plain `StatItem label="Extractions" variant="info" to="/extractions"` next to `Logs`/`Memory` if a text link is wanted too.

## Files to Change

- `src/main.jsx` — register the `/extractions` route.
- `src/components/pages/Extractions.jsx` — new.
- `src/components/pages/controllers/ExtractionsController.jsx` — new (fetches both endpoints, joins on `extractionId`).
- `src/components/pages/helpers/ExtractionsHelper.jsx` — new.
- `src/components/pages/Extractions.css` — new (optional).
