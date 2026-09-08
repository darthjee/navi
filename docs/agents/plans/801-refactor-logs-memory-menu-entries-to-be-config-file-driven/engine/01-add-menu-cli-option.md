# Add the `-m` / `--menu` CLI option

Add a second CLI option to `ArgumentsParser` for the menu-configuration file
path, mirroring `-c` / `--config` in every respect: a `parseArgs` string option
with a short form, a `DEFAULT_MENU_FILE` constant (`config/menu.yml`), and the
same "flag supplied without a value throws `TypeError`" behaviour that falls out
of `parseArgs`.

`parse()` then returns `{ config, menu }`. Downstream consumption of `menu` is
step 04 — this step only widens the parser and its spec.

## Files to Change

- `source/lib/services/application/ArgumentsParser.js` — add
  `DEFAULT_MENU_FILE = 'config/menu.yml'`; add
  `menu: { type: 'string', short: 'm', default: DEFAULT_MENU_FILE }` to
  `ARGUMENTS_CONFIG.options`; export `DEFAULT_MENU_FILE` alongside
  `DEFAULT_CONFIG_FILE`; update the JSDoc return shape to `{ configFile, menuFile }`
  wording as appropriate.
- `source/spec/lib/services/application/ArgumentsParser_spec.js` — import
  `DEFAULT_MENU_FILE`; add `menu: DEFAULT_MENU_FILE` to every existing
  `toEqual({ config: ... })` expectation; add cases for `-m custom/menu.yml`,
  `--menu=custom/menu.yml`, `-m` with no value (throws `TypeError`), and `-m`
  followed by another flag (throws `TypeError`).
