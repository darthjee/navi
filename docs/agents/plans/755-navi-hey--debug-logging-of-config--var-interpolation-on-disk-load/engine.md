# Engine Plan: navi-hey: debug logging of config $VAR interpolation on disk load

Main plan: [plan.md](plan.md)

## Overview

`EnvStringResolver` (`source/lib/common/utils/env_resolver/EnvStringResolver.js`)
resolves `$VAR`/`${VAR}` placeholders in config file content but records
nothing about what it resolved. `ConfigIncluder`
(`source/lib/services/config/ConfigIncluder.js`) reads every file in the
`include:` chain (entry file + each included file) through it. Port #754's
already-shipped client-side design (`clients/node/lib/EnvStringResolver.js` +
`ConfigFileParser.js`) to this pair of classes: `EnvStringResolver` becomes
instance-based and records a `matches` array per `resolve()` call;
`ConfigIncluder#readYaml` — which already runs once per file — emits deduped
per-variable debug lines plus a per-file summary line from those matches.

## Context

- Companion to #754 (merged): reuse its log message strings and payload
  shapes verbatim so the two logs are line-for-line comparable.
- Purely additive: `resolve()`'s return value, the existing
  `Logger.warn('Environment variable not defined: <name>')` call, and
  `ConfigIncluder`'s public API (`resolve()`, `entryRaw`, the returned file
  list shape) are all unchanged.
- Out of scope: changing interpolation behavior itself (#753), the client-side
  equivalent (already done in #754), and `POST /api/config` (stores payloads
  verbatim, never resolves `$VAR`).

## Steps

- [01 — Record matches in EnvStringResolver](engine/01-record-matches-in-env-string-resolver.md)
- [02 — Emit debug logs in ConfigIncluder](engine/02-emit-debug-logs-in-config-includer.md)
- [03 — Add spec coverage](engine/03-add-spec-coverage.md)

## CI Checks

- `source`: `npm run coverage` (CI job: `jasmine`)
- `source`: `npm run lint` (CI job: `checks`)

## Notes

- `source/lib/utils/logging/Logger.js` (used by `ConfigIncluder`) re-exports
  `source/lib/common/utils/logging/Logger.js`, whose `Logger.debug(message,
  attributes = {})` signature already matches the client's `Logger.debug` —
  no logging-facade changes are needed.
- Hash with `createHash('sha256').update(value).digest('hex').slice(0, 12)`
  (`node:crypto`), matching the client port exactly.
