# Extend `/menu.json` to surface hidden non-default routes

SPEC-4's *Menu integration* needs the SPA to know which extension routes an
operator has hidden. IMPL-2 (#802) currently **drops** `hidden: true` entries
whose `route` is not a shipped default, with a `Logger.warn`
(`MenuConfig.#partitionHidden`). Change that so those routes are **kept and
surfaced** in the `/menu.json` response as a separate `hidden` array (shared
contract #4). Shipped-default `hidden` entries keep today's behaviour (suppressed
from `entries`, not listed in `hidden`).

## Changes

### `MenuConfig` (`source/lib/models/configs/MenuConfig.js`)

- `#partitionHidden`: instead of `Logger.warn` + drop for a non-default `hidden`
  entry, collect its `route` into a `hiddenRoutes` list (order = file order,
  de-duplicated).
- `#resolve` / `fromFile` must now return **both** the visible `MenuEntry[]` and
  the `hiddenRoutes: string[]`. Options, pick one and keep it internally
  consistent:
  - return a small result object `{ entries: MenuEntry[], hidden: string[] }`
    from `fromFile` and update the one caller (`ApplicationConfigurator` /
    wherever `menuConfig` is built) plus `ServerController.build` /
    `Router`/`WebServer` constructors to carry `menuHidden` alongside
    `menuConfig`; **or**
  - keep `fromFile` returning `MenuEntry[]` but append the hidden routes as
    `MenuEntry` instances flagged `hidden: true` (see `MenuEntry` change below),
    and let `MenuHandler` partition them out. **This is the smaller-blast-radius
    option** — no signature changes through `ServerController` / `WebServer` /
    `Router`.
- Keep the existing dedupe / reposition / shipped-default-suppression logic
  untouched for the visible list.

### `MenuEntry` (`source/lib/models/configs/MenuEntry.js`)

- Only if taking the "flag on the instance" option above: add an optional
  `hidden` boolean to the constructor (default `false`) and expose it as a public
  field/getter. `toJSON()` stays `{ route, text }` (hidden never serialized as an
  entry). `ALLOWED_KEYS` / validation already accept `hidden` in the raw mapping —
  no change there.

### `MenuHandler` (`source/lib/server/handlers/MenuHandler.js`)

- Split the incoming entries: `visible = entries.filter(e => !e.hidden)`,
  `hidden = entries.filter(e => e.hidden).map(e => e.route)` (or read the
  separate `hidden` list if the result-object option was chosen).
- Respond `{ entries: MenuSerializer.serialize(visible), hidden }` — `hidden` is
  always present, `[]` when there are none.

### `MenuSerializer`

- No change needed (still serializes visible `MenuEntry` → `{ route, text }`).

## Files to Change

- `source/lib/models/configs/MenuConfig.js` — keep non-default `hidden` routes
  instead of dropping them.
- `source/lib/models/configs/MenuEntry.js` — (conditional) carry a public
  `hidden` flag.
- `source/lib/server/handlers/MenuHandler.js` — emit the `hidden` array.
- `source/spec/lib/models/configs/MenuConfig_spec.js` — replace the
  "non-default `hidden` is skipped with a warning" expectations with
  "non-default `hidden` route is retained and reported"; keep shipped-default
  `hidden` suppression tests.
- `source/spec/lib/models/configs/MenuEntry_spec.js` — (conditional) `hidden`
  flag defaulting / getter.
- `source/spec/lib/server/handlers/MenuHandler_spec.js` — assert `hidden` key is
  always present; `[]` when none; populated for non-default hidden entries;
  `entries` unaffected.
- `docs/agents/future/menu-configuration.md` — update the `hidden` description
  and the worked example: `hidden: true` on a non-default `route` no longer warns
  and drops — it is reported in `/menu.json`'s `hidden` list for the SPA to
  filter extension routes against.
