# Adopt helpers in Emissions and Extractions
In `Emissions_spec.js` and `Extractions_spec.js`:

- Remove the local `flushAsync` and import it from `../support/async.js`.
- Replace the `while loading` block and the `when the fetch fails` / `when a fetch fails` block with a single `itBehavesLikeFetchStates({ state, render: () => renderEmissions(state.root), loadingText: 'Loading emissions', errorText: 'Failed to load emissions', status: 503 })` call (Extractions: `renderExtractions`, `'Loading extractions'`, `'Failed to load extractions'`, 503).
- Drop the now-unused imports (`noop`, `mockFetchFailure`); keep `act`/`createElement`/`MemoryRouter` since the local render closure still uses them.
- Leave the success blocks, empty-state blocks and the spec-specific fetch mocks (`mockCursorFeed`, `mockPair`) untouched; they keep using the shared `flushAsync`.

Consequence: both specs gain the "no spinner" assertion in their error state, and the single error `it` is split into the shared four.

## Files to Change
- `frontend/spec/components/Emissions_spec.js` — use shared `flushAsync` and `itBehavesLikeFetchStates`
- `frontend/spec/components/Extractions_spec.js` — same
