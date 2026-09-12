# Plan: Add emit.enabled / emit.disabled flags to toggle a resource's emit without editing the config

Issue: [833_add-emit-enabled-emit-disabled-flags-to-toggle-a-resource-s-emit-without-editing-the-config.md](../../issues/833-add-emit-enabled-emit-disabled-flags-to-toggle-a-resource-s-emit-without-editing-the-config.md)

## Overview

Add two optional keys, `enabled` and `disabled`, under a resource's `emit:`
block, resolved with the exact same formula the codebase already uses for
the unrelated resource-level `enabled`/`disabled` pair
(`ResourceRequest.js:62`, `disabled === true || enabled === false`). Since
every config file already runs through `$VAR`/`${VAR}` substitution before
YAML parsing, this alone lets an operator toggle a resource's emit per
environment by setting an env var to the literal text `true`/`false` — no
new resolution mechanism, no new config-loading code. The engine agent adds
the resolution + gating logic and its tests; the docs agent documents the
new keys in the user-facing emit-configuration guide.

## Agents involved

- [engine](engine.md)
- [docs](docs.md)

## Shared contracts

- **Config keys** (docs must describe exactly what engine implements):
  under `resources.<name>[].emit`, two new optional keys, `enabled` and
  `disabled`, both booleans (or a `$VAR`/`${VAR}` reference that resolves to
  the literal YAML text `true`/`false`).
- **Resolution rule**: effective-disabled = `disabled === true || enabled === false`.
  Only literal `true`/`false` participate; an omitted key, or a value that
  isn't exactly one of those two (e.g. an unset env var, which
  `EnvStringResolver` substitutes with `''`, parsing to `null`), is inert —
  it neither forces disabled nor enabled on its own. Both keys omitted →
  enabled (today's default, unchanged).
- **Validation is unaffected by the resolved value**: the `emit` block
  (`method`, `url`, `headers`, `body_template`, etc.) is still fully
  validated at config-load time regardless of whether it resolves enabled or
  disabled — nothing new to throw, nothing skipped.
- **Effect of disabled**: only the follow-up emit HTTP call is skipped;
  parsing/extraction for the resource is unaffected. No change to
  `EmitEnqueuer`, `EmitJob`, or `EmissionRegistry`.

## Notes

- `docs/agents/flow/actions-and-assets.md` (architecture documentation under
  `docs/agents/`, owned by the architect rather than either specialist above)
  should get a short note that `ResourceRequest#hasEmit()` now also depends
  on the resolved `disabled` flag, not just whether the `emit` block is
  declared — a one-line update alongside whichever agent lands the code
  change, or as a follow-up architect commit.
