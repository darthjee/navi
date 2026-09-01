# Add spec coverage

Mirror the spec structure already in place for #754
(`clients/node/spec/lib/EnvStringResolver_spec.js` and
`clients/node/spec/lib/ConfigFileParser_spec.js`'s "debug logging of $VAR
interpolation" block).

`EnvStringResolver_spec.js`: add a `#resolve` / `matches` `describe` block
covering — a set var recorded as defined with correct `length`/`hash`; a
set-but-empty var recorded with `length: 0`; an unset var recorded as
`{ varName, defined: false }` (no `length`/`hash`); one entry per occurrence
(not deduped) for a string with repeated references; deterministic hashing
for the same value across two separate `resolve()` calls; and an empty
`matches` array for a fresh instance before `resolve()` is called.

`ConfigIncluder_spec.js`: add a "debug logging of $VAR interpolation"
`describe` block, `spyOn(Logger, 'debug')` in a `beforeEach`, covering — one
deduped debug line per distinct variable per file; a per-file summary line
with correct `placeholders`/`resolved`/`missing` counts (including the
zero-placeholders case); an unset variable reported as `{ path, defined:
false }`; and the include-chain case — reusing or extending the existing
`config/split_config/` fixture (or a new fixture) with at least one `$VAR`
reference in the entry file and one in an included file, asserting each file
gets its own independently-deduped variable set and its own summary line
(same shape as the client's "logs an independent summary and variable set per
file for multi-file runs" test, adapted to a single `ConfigIncluder.resolve()`
call across the whole chain instead of two separate `ConfigFileParser.parse()`
calls).

## Files to Change

- `source/spec/lib/common/utils/env_resolver/EnvStringResolver_spec.js` — add
  the `matches`-recording coverage described above.
- `source/spec/lib/services/config/ConfigIncluder_spec.js` — add the debug-log
  coverage described above, including the include-chain case.
- `source/spec/support/fixtures/config/split_config/*.yml` (or a new fixture
  directory) — add `$VAR`/`${VAR}` references as needed for the include-chain
  test, if the existing `split_config` fixtures don't already have enough to
  exercise a variable in both the entry file and an included file.
