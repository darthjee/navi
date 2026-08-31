# Debug-log interpolation

`EnvStringResolver` is only ever consumed by `ConfigFileParser` (confirmed by grep — no other call sites), and `ConfigFileParser` is the one that knows the file path, so it drives the logging; `EnvStringResolver` just needs to expose per-occurrence resolution data for it to consume.

In `EnvStringResolver`, change the instance `resolve()` method to record each regex match — cheap enough to always compute, regardless of the active log level (only the eventual `Logger.debug` call is level-gated, same as everywhere else in this codebase) — into an instance-level array, e.g. `this.matches` (or a `getMatches()` accessor): `{ varName, defined, length, hash }`, where `defined` mirrors the existing `resolved !== undefined` check, `length` is `resolved.length` when defined (`0` for a set-but-empty var), and `hash` is the first 12 hex chars of `sha256(resolved)` via `node:crypto`'s `createHash('sha256')`, computed only when `defined` is true. Keep the static `EnvStringResolver.resolve(string)` shortcut working for any other current/future single-call use, but have `ConfigFileParser` switch to the instance form (`new EnvStringResolver(content)`, then `.resolve()`, then read `.matches`) since it needs that data afterward.

In `ConfigFileParser`, after resolving a file's content, dedupe `matches` by `varName` (a `Map` keyed by var name, keeping the first occurrence — value/status is identical across repeats within one file) and emit:

- one `Logger.debug` line per unique var: name, `defined`, and (when defined) `length` + `hash` — never the raw value.
- one `Logger.debug` summary line for the whole file: `this.path`, total placeholder count (`matches.length`, **not** deduped — this counts occurrences), resolved count, missing count.

## Files to Change

- `clients/node/lib/EnvStringResolver.js` — instance `resolve()` records per-match `{ varName, defined, length, hash }` into `this.matches`; add a `#hash(value)` private helper using `node:crypto`. No change to the static `resolve(string)` shortcut's return value or the existing `console.warn`-turned-`Logger.warn` behavior (step 03).
- `clients/node/lib/ConfigFileParser.js` — `#readResolved()` (or a new private step right after it) switches to the instance form of `EnvStringResolver`, dedupes `matches`, and emits the per-variable `Logger.debug` lines plus the per-file summary `Logger.debug` line.
