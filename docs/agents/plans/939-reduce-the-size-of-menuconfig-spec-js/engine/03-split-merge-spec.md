# Split merge behavior into MenuConfig_merge_spec.js
Create `source/spec/lib/models/configs/MenuConfig_merge_spec.js` (`describe('MenuConfig')` → `describe('.fromFile')` → merge scenarios) and move these blocks into it unchanged, using `MenuConfigFileUtils` for setup:

- when hidden is true on a default route
- when hidden is true on a non-default route (both examples)
- when a custom entry repositions a default (all three examples)
- when a route is duplicated in the merged list
- when a custom entry reuses a default label on a different route
- when one entry is malformed among valid ones

Keep in `MenuConfig_spec.js`: the statics (`.DEFAULT_ENTRIES`, `.DEFAULT_ROUTES`, `.defaultLabel`) and the parse-level `.fromFile` behavior (the default-entries table, custom mappings, `defaults: false`, non-boolean `defaults`, unparseable YAML, `entries` not a list, env interpolation).

Afterwards, check that both files are under 300 lines and that `npm run spec`, `npm run lint`, and `npm run report` pass in `source/`, with the size check reporting no WARN/ERROR for either file.

## Files to Change
- `source/spec/lib/models/configs/MenuConfig_merge_spec.js` — new spec with the merge-behavior scenarios
- `source/spec/lib/models/configs/MenuConfig_spec.js` — remove the moved blocks and their now-unused imports (e.g. `MenuConfigurationInvalid` stays, `Logger` stays if non-boolean `defaults` remains here)
