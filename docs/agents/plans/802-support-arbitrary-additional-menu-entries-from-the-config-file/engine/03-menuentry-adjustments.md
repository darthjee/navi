# MenuEntry: carry hidden and preserve default labels

`MenuConfig`'s new pipeline needs `MenuEntry` to stop discarding information it
now depends on.

- `MenuEntry.fromObject` currently builds `new MenuEntry({ route, text })` and
  drops `hidden`. Decide the cleanest split:
  - Preferred: keep `MenuEntry` a pure `{ route, text }` render model and let
    `MenuConfig` do all reposition/label logic on raw objects, passing an already
    resolved `text` into `fromObject`. Then `fromObject` needs an optional second
    arg or `MenuConfig` calls `new MenuEntry({ route, text: resolvedText })`
    directly.
  - If instead `hidden` is carried onto the instance, ensure `toJSON` still emits
    only `{ route, text }` (there is already a spec: "never serializes hidden").
- Confirm `constructor` still defaults `text` to `route` for the non-default,
  no-`text` case (unchanged).
- No change to `MenuEntry.validate` / `#firstReason` / the `ALLOWED_KEYS`
  (`route`, `text`, `hidden`) — `hidden` stays an accepted, type-checked key.
  `hidden`'s *meaning* is applied in `MenuConfig`, not here.

Keep this change as small as the chosen approach allows; the resolution logic
belongs in `MenuConfig` (step 02), not spread into the model.

## Files to Change

- `source/lib/models/configs/MenuEntry.js` — minimal change so `MenuConfig` can
  supply a resolved `text` (and, if that approach is taken, read `hidden`);
  `toJSON` stays `{ route, text }` only.
