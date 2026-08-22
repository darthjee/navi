# Wire parser/emit into ResourceRequest

Extend `ResourceRequest`'s constructor to destructure `parser` and `emit` off the raw attrs, the same way it already does for `actions`/`assets`/`paginated_actions`:

- `parser` (raw object, optional) → build a `ResourceRequestParser` via `fromObject` when present, `undefined`/`null` otherwise.
- `emit` (raw object, optional) → build a `ResourceRequestEmit` via `fromObject` when present, `undefined`/`null` otherwise.

Expose both as read-only getters (`get parser()`, `get emit()`), matching the existing `actions`/`assets`/`paginatedActions` exposure style (plain public fields are fine too, matching whichever style the surrounding fields already use — `actions`/`assets`/`paginatedActions` are plain public fields, not private-field getters, so follow that).

Update the class-level JSDoc (`@param {object} [attributes.parser]`, `@param {object} [attributes.emit]`) to match the existing param documentation style for `actions`/`assets`.

Resources without `parser`/`emit` must behave exactly as before — no new required fields, no new validation triggered when both are absent.

## Files to Change

- `source/lib/models/request/ResourceRequest.js` — constructor destructuring + field/getter exposure for `parser`/`emit`, using the models from Step 02.
