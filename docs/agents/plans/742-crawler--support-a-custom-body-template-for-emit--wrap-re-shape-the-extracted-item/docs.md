# docs Plan: Crawler: support a custom body template for emit (wrap/re-shape the extracted item)

Main plan: [plan.md](plan.md)

## Shared contracts

Documents the `emit.body_template` contract described in [plan.md](plan.md#shared-contracts) — the exact token syntax (`{:key}`, `{:nested.path}`, `{:.}` for the whole item), whole-token splice vs. string interpolation, and missing-token behavior (literal token left in place). Do not describe any behavior not listed there; if something looks missing or wrong, check with `engine` rather than guessing.

## Implementation Steps

### Step 1 — Add a dedicated Emit Configuration guide

None of `emit`'s config (`client`, `method`, `url`, `status`, `retries`, `cooldown`, `headers`, and now `body_template`) is documented anywhere in `docs/guides/` yet, despite already being implemented (#676, #701–#705) — this is a pre-existing gap, not something introduced by this issue. Since `body_template` can't be meaningfully documented in isolation from the rest of `emit`, backfill a minimal `emit` reference alongside it, following this repo's existing one-guide-per-feature pattern (`docs/guides/navi/paginated-actions.md`, `docs/guides/navi/warming-html-assets.md`).

Create `docs/guides/navi/emit-configuration.md`:
- A short intro: what `emit` is (a follow-up HTTP call made with data collected while crawling a resource), and where it lives in the config (a resource entry's `emit:` key).
- A field list for `client`, `method`, `url`, `status`, `retries`, `cooldown`, `headers` — one line each, matching current behavior (read `source/lib/models/request/ResourceRequestEmit.js`'s JSDoc for exact semantics/defaults; do not invent behavior).
- A `### Body Template` subsection for `body_template`:
  - What it's for: reshaping/wrapping the extracted item instead of sending it bare.
  - The `{:key}` / `{:nested.path}` token syntax, and `{:.}` for referencing the whole item.
  - Whole-token values (a string that's *only* one token) splice in the real typed value (object/array/number/etc.); tokens inside a longer string are stringified.
  - An unresolved token is left as the literal `{:...}` text.
  - No `body_template` ⇒ the bare item is sent, unchanged.
  - An example YAML block wrapping an item into an envelope, e.g. `{ "event": "item.extracted", "data": "{:.}" }`, mirroring the style of `paginated-actions.md`'s `### Example` section.

### Step 2 — Link the new guide

Add an entry to the Table of Contents in `docs/guides/how_to_use_navi.md`, in the same list-item style as the existing entries (short link + one-line description), positioned near `paginated-actions.md` / `warming-html-assets.md`.

## Files to Change

- `docs/guides/navi/emit-configuration.md` — new file.
- `docs/guides/how_to_use_navi.md` — add one Table of Contents entry.

## Notes

- Confirm current `emit.retries` / `emit.cooldown` / `headers` defaults against `source/lib/jobs/EmitJob.js` (`DEFAULT_MAX_RETRIES`, `DEFAULT_COOLDOWN`) and `ResourceRequestEmit.js` before writing the field list — don't rely on this plan's summary for exact defaults.
- Scope check: this step backfills only enough of the general `emit` docs to give `body_template` context; it is not a full audit of every `emit`-related issue's behavior (e.g. #703/#704's emission tracking/dashboard views are out of scope here).
