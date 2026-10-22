# Issue: Create the docs/agents/specs.md hub for all spec files

## Description

Specs of not-yet-implemented work live under `docs/agents/specs/` (today only the crawler feature: `docs/agents/specs/crawler.md` + `docs/agents/specs/crawler/`). There is no single entry point listing them; `AGENTS.md` links the folder directly.

Create `docs/agents/specs.md` as a permanent hub for all spec files, the same hub pattern used by `docs/agents/architecture.md`, `docs/agents/flow.md`, etc.

Part of the release-cycle overhaul epic (#977); the release spec written next will be listed here.

## Problem

Specs of not-yet-implemented work have no single entry point. `AGENTS.md` links the `docs/agents/specs/` folder directly and also carries the spec conventions inline. With the release spec (#979) about to join the crawler spec, there is nowhere to see at a glance which specs exist, and no rule that keeps such a list current.

## Expected Behavior

- `docs/agents/specs.md` exists and links `docs/agents/specs/crawler.md`.
- `docs/agents/specs.md` holds the spec conventions, including the add/remove-from-hub rule.
- `AGENTS.md` links the hub from its docs table, and its Specs section points to the hub instead of repeating the conventions.
- The hub documents the empty-state placeholder (`_No specs at the moment._`) and links only top-level spec files.

## Solution

### Scope

- Create `docs/agents/specs.md` with:
  - A short intro: what specs are (guidelines for not-yet-implemented work), and that each spec is removed once its work is implemented and documented in its permanent place, while the hub itself stays.
  - The spec conventions, moved from `AGENTS.md`'s `### Specs (docs/agents/specs/)` section: one file per topic at `docs/agents/specs/<topic>.md`, split into a hub plus subfolder when it grows too large (see `crawler.md` / `crawler/`), the spec is removed after implementation, and the `docs/agents/specs/` folder is permanent.
  - A new rule: every new spec must be added to the hub's table, and its row removed when the spec is deleted.
  - A `| Spec | Description |` table (same shape as the other hubs) with one row per spec. Today that is only the crawler spec:
    `| [Crawler](specs/crawler.md) | Information crawling & data emission (incomplete design). |`
- Update `AGENTS.md`:
  - The docs-table row `[Specs](docs/agents/specs/)` links `docs/agents/specs.md` instead.
  - The `### Specs (docs/agents/specs/)` section shrinks to a short pointer to `docs/agents/specs.md`, which now holds the conventions.
- Out of scope: any change to the crawler spec content. The release spec row is added by #979, not here.

### Edge cases

- **No specs left**: when the last spec is removed, the table is replaced by the line `_No specs at the moment._`. The intro and conventions stay, so the hub is always valid.
- **Hub + subfolder specs**: the hub has one row per spec and links only its top-level `docs/agents/specs/<topic>.md`. That spec's own hub lists its topic files, so the hub never lists subfiles.
- **Drift** (a spec deleted but its row left, or the reverse): handled by the add/remove rule stated in the hub, checked in review. No CI check.

### Backward compatibility

- No files are moved or renamed: `docs/agents/specs/` and its contents stay in place, so existing links keep working.
- `AGENTS.md` (docs-table row and `### Specs` section) is the only existing file that changes. No agent definitions or scripts under `.claude/` reference the specs folder.
- Known out-of-scope risk: `README.md:483` links directly to `docs/agents/specs/crawler/flows.md`. That link will break when the crawler spec is eventually removed. Repointing it is the job of whoever removes the crawler spec, not of this issue.

### Alternatives considered

- **`docs/agents/specs.md` (chosen)**: a sibling hub next to the folder, following the existing `architecture.md` + `architecture/` and `flow.md` + `flow/` pattern (and `crawler.md` + `crawler/` inside specs). Removing a spec subfolder never touches it.
- `docs/agents/specs/README.md`: GitHub shows it automatically when browsing the folder, but no other doc folder in the repo uses this convention, and it puts the index alongside the specs.
- Listing specs directly in `AGENTS.md`: no hub file, but `AGENTS.md` would change on every spec add/remove and grow over time.

## Benefits

- One permanent entry point listing every active spec, following the same hub pattern as the rest of `docs/agents/`.
- `AGENTS.md` stays stable: adding or removing a spec touches only the hub.
- The epic's release spec (#979) and its later removal (#980) each have a clear place to register and unregister.
