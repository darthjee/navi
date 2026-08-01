# Plan: Update README

Issue: [610-update-readme.md](../issues/610-update-readme.md)

## Overview

Bring the top-level `README.md` back in sync with three features that already shipped and are documented elsewhere (`docs/agents/web-server.md`, `docs/agents/flow/startup-and-config.md`, `docs/HOW_TO_USE_NAVI.md`) but never made it into the README: per-resource `disabled`/`enabled`, `web.idle_timeout` auto-shutdown, and config splitting via `include`/`namespace`. The README stays a high-level entry point — full `include`/`namespace` semantics remain in `docs/HOW_TO_USE_NAVI.md`.

## Context

Three merged commits added functionality without a README update:
- `e528425` — resource-request entries can be marked `disabled: true` (or `enabled: false`) to exclude them from every enqueue path.
- `08708f4` — `web.idle_timeout` (seconds) auto-shuts-down the app after sustained idleness.
- `9963325` — config splitting across files via top-level `include:` and `namespace:` keys, with cross-namespace references.

`README.md`'s "Configuration File" section (YAML example + Fields table) and "Key features" bullet list currently reflect the pre-these-commits config surface.

## Implementation Steps

### Step 1 — Add `web.idle_timeout` to the README

In the `## Configuration File` → `### Structure` YAML example (`README.md`, `web:` block, currently lines ~64–66), add:

```yaml
web:
  port: 3000           # port for the monitoring web UI (omit to disable)
  autostart: true       # whether the engine starts processing immediately at boot (default: true)
  idle_timeout: 900     # seconds of inactivity before auto-shutdown (default: 0, disabled)
```

In the `### Fields` table, add a row directly after `web.autostart`:

```
| `web.idle_timeout` | Optional. Seconds of sustained idleness (no busy workers, no jobs in any queue) before the application auto-shuts-down, same as `PATCH /engine/shutdown`. The countdown resets whenever a job exists or a worker becomes busy. Defaults to `0` (disabled — the web server lingers indefinitely). Independent of `web.enable_shutdown`. |
```

### Step 2 — Document the `disabled`/`enabled` resource field

In the same YAML example, add a `disabled: true` comment to one resource-request entry (e.g. the `products` resource) to make the feature visible in context, mirroring how `docs/agents/flow/startup-and-config.md` does it:

```yaml
  products:
    - url: /categories/{:category_id}/products/{:page}.json
      status: 200
      disabled: true   # optional: excludes this request from every enqueue path (see below)
```

In the `### Fields` table, add a row after `status` (or after `client`, wherever the per-request fields are listed):

```
| `disabled` / `enabled` | Optional. Set `disabled: true` (or `enabled: false`) on a resource-request entry to keep its YAML definition in place while excluding it from every enqueue path: startup, manual/API trigger by name, and as an `actions`/`paginated_actions` target. `disabled: true` always wins over any `enabled` value. Defaults to enabled. |
```

### Step 3 — Mention config splitting in Key Features

In the `## Overview` → "Key features" bullet list, add one bullet:

```
- Config splitting: split `resources`/`clients` across multiple files with top-level `include`/`namespace` keys, with validated cross-namespace references. See [How to Use Navi in Your Project](https://github.com/darthjee/navi/blob/main/docs/HOW_TO_USE_NAVI.md#config-splitting-with-include-and-namespace) for details.
```

> Verify the actual anchor slug GitHub generates for the `docs/HOW_TO_USE_NAVI.md` config-splitting heading before finalizing the link (read the heading text in that file rather than guessing).

### Step 4 — Proofread

Re-read the full `## Configuration File` section after edits to confirm the YAML example is still valid, internally consistent (comment alignment, no duplicate `disabled`/`idle_timeout` mentions), and that the Fields table row order still roughly follows the YAML example's order.

## Files to Change

- `README.md` — add `web.idle_timeout` and `disabled`/`enabled` to the YAML example and Fields table; add a config-splitting bullet to Key Features.

## Notes

- No source code changes — this is a documentation-only issue confined to `README.md`.
- No specialist agent (`dev`, `engine`, `frontend`) has work here since `README.md` is a root-level file; this plan is handled directly by whichever agent implements it (architect scope), no agent split needed.
- No CI job specifically lints README content; `check-version-tag` only validates version strings on release tags and is unaffected by this change.
