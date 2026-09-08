# `MenuEntry` model + menu loader with validation

Introduce the model and loader that turn `config/menu.yml` into a validated list
of entries, with the fail-fast / skip-and-warn / fallback-constant behaviour from
the shared contract.

## `MenuEntry` model

`source/lib/models/configs/MenuEntry.js`, modeled closely on `Link.js`:

- `constructor({ route, text })` — stores `route`; `this.text = text ?? route`.
- `static fromObject(entry)` — accepts a mapping `{ route, text?, hidden? }`
  only (no bare-string form). Returns a `MenuEntry`.
- `toJSON()` — `{ route: this.route, text: this.text }` (no `hidden`).
- `static isValid(entry)` / a validation helper returning `{ valid, reason }`:
  - `route`: required, `typeof === 'string'`, non-empty, no whitespace
    (`/\s/`), and (`route.startsWith('/')` || `/^https?:\/\//.test(route)`).
  - `text`: optional; when present must be a non-empty string.
  - `hidden`: optional; when present must be a boolean (value otherwise ignored
    in IMPL-1).
  - any key other than `route` / `text` / `hidden` ⇒ invalid ("unknown key").

## Menu loader

`source/lib/models/configs/MenuConfig.js` (or `source/lib/services/config/MenuLoader.js`
— pick whichever matches the `Link`/`WebConfig` vs `ConfigLoader` split best; the
model-side location keeps it next to `MenuEntry`). Responsibilities:

- `static DEFAULT_ENTRIES` / fallback constant:
  `[{ route: '/logs', text: 'Logs' }, { route: '/memory/status', text: 'Memory' }]`
  as `MenuEntry` instances.
- `static fromFile(path)`:
  1. If the file does not exist, or reads as empty/whitespace-only ⇒ return
     `DEFAULT_ENTRIES` (not an error).
  2. Otherwise parse with the core of `ConfigIncluder.#readYaml`:
     `readFileSync(path, 'utf8')` → `new EnvStringResolver(content).resolve()` →
     `YAML.parse(resolved)`. A thrown parse error, or a parsed value where
     `entries` is present but not an array, ⇒ **throw** a new typed exception
     `MenuConfigurationInvalid` (see below).
     - `entries` absent from an otherwise-valid document ⇒ treat as
       empty ⇒ `DEFAULT_ENTRIES` (same as empty file).
     - `entries: []` explicitly ⇒ return `[]` (empty menu, not the defaults).
  3. For each raw entry: run validation. Invalid ⇒ skip and
     `Logger.warn('[menu] skipping invalid entry at index N: <reason>')`.
     Valid ⇒ `MenuEntry.fromObject(entry)`.
  4. Return the resulting `MenuEntry[]` in file order. (No merge with defaults,
     no dedup, no `hidden`/`defaults` handling — IMPL-2.)

## New exception

`source/lib/exceptions/config/MenuConfigurationInvalid.js` — same class shape as
`MissingTopLevelConfigKey` / `ConfigurationFileNotFound` (extends the shared base
error, carries the file path and a message). Export/register it wherever the
sibling config exceptions are.

## Files to Change

- `source/lib/models/configs/MenuEntry.js` — new model (see above).
- `source/lib/models/configs/MenuConfig.js` — new loader (see above).
- `source/lib/exceptions/config/MenuConfigurationInvalid.js` — new exception.
- `source/spec/lib/models/configs/MenuEntry_spec.js` — new; mirror
  `Link_spec.js` (construction, `text` defaulting, `fromObject`, `toJSON`,
  validation matrix incl. whitespace route, non-`/`/non-URL route, unknown key,
  non-boolean `hidden`).
- `source/spec/lib/models/configs/MenuConfig_spec.js` — new; cover missing file,
  empty file, whitespace-only file, `entries` absent, `entries: []`, valid
  entries, one malformed entry among valid ones (asserts `Logger.warn` called
  and the entry dropped), unparseable YAML (throws `MenuConfigurationInvalid`),
  `entries` not a list (throws), and `${VAR}` interpolation.
- `source/spec/lib/exceptions/config/MenuConfigurationInvalid_spec.js` — new;
  mirror a sibling config-exception spec.
