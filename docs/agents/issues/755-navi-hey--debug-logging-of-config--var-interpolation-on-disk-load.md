# Issue: navi-hey: debug logging of config $VAR interpolation on disk load

## Description

Spun off from #753 (investigation into majora #1241). Companion to #754
(already merged), which added the same debug logging to `navi-client`'s
config loading; this issue is the engine-side (`navi-hey`) equivalent, kept
consistent with #754's shipped format so the two logs can be compared
line-for-line when the same config file is loaded from both sides.

## Problem

When `navi-hey` loads its own config files from disk — at boot (`-c <file>`) or
on `PATCH /engine/reload` — `ConfigIncluder` resolves `$VAR` / `${VAR}`
placeholders (`EnvStringResolver.resolve(content)` before `YAML.parse`), but
nothing is logged about which placeholders were resolved or to what. A missing
variable produces a single `Logger.warn("Environment variable not defined: X")`
and is otherwise silently substituted with `''`. This makes misconfigured or
unexpectedly-empty env var interpolation hard to diagnose.

## Expected Behavior

When the configured log level is `debug`, `ConfigIncluder` (via
`EnvStringResolver`) emits, for **every** file in the `include:` chain (the
entry file and each included file, not just the entry), a per-variable line
for each distinct `$VAR`/`${VAR}` placeholder encountered:

- variable name;
- whether it was set;
- if set: resolved **value length** and a **value hash** (first 12 hex chars
  of SHA-256) — never the raw value;
- if unset: marked explicitly (it still falls back to `''`, unchanged);

followed by one summary line per file: file path, placeholder count, resolved
count, missing count — emitted even for a file with zero placeholders.

Out of scope:

- Changing interpolation behaviour itself — that decision belongs to #753.
- The client-side (`navi-client`) equivalent — already covered by #754.
- `POST /api/config` — that path stores payloads verbatim and never resolves
  `$VAR` (a deliberate security boundary); logging incoming requests there is
  a separate issue.

## Solution

Use the existing `Logger.debug` facade, reusing #754's shipped format
verbatim (`clients/node/lib/EnvStringResolver.js` + `ConfigFileParser.js`)
rather than re-deriving one.

### Format

- One `Logger.debug` line per **distinct** variable name encountered in a file
  (deduped — repeats within the same file resolve identically, so only the
  first occurrence is logged):
  - message: `` `Config interpolation: $${varName}` ``
  - payload when defined: `{ path, defined: true, length, hash }`
  - payload when missing: `{ path, defined: false }`
  - `length` is the resolved value's string length; `hash` is the first 12 hex
    chars of the value's SHA-256 digest (`createHash('sha256').update(value).digest('hex').slice(0, 12)`).
- One summary line per file, after all its placeholders are processed:
  - message: `` `Config interpolation summary: ${path}` ``
  - payload: `{ path, placeholders, resolved, missing }` — `placeholders` counts
    every occurrence (not deduped), `resolved`/`missing` split that count.
- The existing `Logger.warn('Environment variable not defined: <name>')` call
  stays as-is (unchanged from today).

### Architecture (mirrors #754's split)

- `source/lib/common/utils/env_resolver/EnvStringResolver.js` becomes
  instance-based like the client port: `resolve()` records a `matches` array
  (`{ varName, defined, length?, hash? }` per occurrence, in match order, not
  deduped) on the instance, in addition to returning the resolved string and
  keeping the existing `warn` call for missing vars.
- `ConfigIncluder#readYaml` (`source/lib/services/config/ConfigIncluder.js`) —
  which already reads and resolves exactly one file per call — instantiates
  `EnvStringResolver` directly (instead of using the static `.resolve()`
  shortcut it uses today), and after resolving, emits the per-variable and
  summary debug lines described above for that file's `matches`. Since
  `#readYaml` already runs once per file in the include chain (entry + every
  included file), this naturally scopes the dedup and summary to each file
  without extra bookkeeping in `#collect`/`#resolveIncludes`.
- No changes needed to `ConfigIncluder`'s public API or `#collect`/
  `#resolveIncludes` traversal logic — this is additive logging inside
  `#readYaml` only.

### Edge cases

- A file with zero `$VAR`/`${VAR}` placeholders still emits the summary line
  (`{ placeholders: 0, resolved: 0, missing: 0 }`), just with no per-variable
  lines — matches #754's behavior, so every file in the chain is confirmed
  processed even when trivial.
- Dedup is per-file only: the same variable name appearing in multiple files
  across the include chain (e.g. both the entry file and an included file
  reference `$FOO`) gets its own deduped line **in each file**, since
  `#readYaml` — and therefore the `matches` array — is scoped to one file per
  call. There is no cross-file dedup.
- A variable can't resolve differently across occurrences within the same
  file (the same `resolve()` call reads `process.env` once per occurrence
  during a single synchronous pass), so "first occurrence wins" dedup never
  hides a diverging outcome.

### Backward compatibility

Purely additive:

- `EnvStringResolver#resolve()` still returns just the resolved string;
  `matches` is a new instance property, not a change to the return value or
  method signature.
- The existing `Logger.warn('Environment variable not defined: <name>')`
  behavior for missing vars is untouched.
- `ConfigIncluder`'s public surface (`resolve()`, `entryRaw`, the returned file
  list's `{ namespace, resources, clients, filePath }` shape) is unchanged —
  no consumer of either class needs to change.

### Testing strategy

Mirror the spec structure already in place for #754:

- `source/spec/lib/common/utils/env_resolver/EnvStringResolver_spec.js` gains
  coverage for the new `matches` recording (defined and missing cases), same
  shape as `clients/node/spec/lib/EnvStringResolver_spec.js`.
- `source/spec/lib/services/config/ConfigIncluder_spec.js` gains coverage for
  the debug log lines emitted per file, including the include-chain case
  (entry file + at least one included file, asserting each gets its own
  deduped set of lines and its own summary).

## Benefits

- Makes misconfigured or unexpectedly-empty `$VAR` interpolation diagnosable
  from debug logs alone, without exposing secret values.
- Keeps the engine and client interpolation logs in an identical,
  line-for-line comparable format, so a shared config file's resolution can be
  cross-checked across both sides during an incident.
