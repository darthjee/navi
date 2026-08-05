# Plan: reorganize how to use documentation

Issue: [630-reorganize-how-to-use-documentation.md](../../issues/630-reorganize-how-to-use-documentation.md)

## Overview

Split the flat `docs/` root into two purpose-built trees: `docs/agents/external/` for contributor-facing docs about external tools Navi depends on (currently just Tent), and `docs/guides/` for external-developer-facing integration guides (the existing Navi guide plus a new one for `navi-hey-client`). Both moved bundles keep their existing main-file + relative-linked-subfolder shape unchanged — only their parent location moves — so a plain `git mv` is enough for the move itself; the remaining work is updating external references and agent-ownership docs.

## Context

- `docs/HOW_TO_USE_DARTHJEE-TENT.md` + `docs/tent/` document Tent, an external tool the local dev proxies (`dev/agents/dev-proxy.md`) depend on. It is internal/contributor-facing material but currently sits at the `docs/` root.
- `docs/HOW_TO_USE_NAVI.md` + `docs/navi/` is the integration guide for external developers/AI agents consuming Navi. It also has no dedicated, discoverable home.
- There is no equivalent guide yet for the `navi-hey-client` npm package (`clients/node/`).
- Both `HOW_TO_USE_*.md` bundles use deliberately relative internal links (`./<folder>/*.md` forward, `../HOW_TO_USE_*.md` back) so each bundle can be copied into any project as a self-contained unit. This must be preserved — do not rewrite the relative links inside the moved files, only move the files as a unit.

## Implementation Steps

### Step 1 — Move the Tent docs under `docs/agents/external/`

```bash
mkdir -p docs/agents/external
git mv docs/HOW_TO_USE_DARTHJEE-TENT.md docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md
git mv docs/tent docs/agents/external/tent
```

No content edits needed inside the moved files — the main file's `./tent/*.md` links and each split page's `../HOW_TO_USE_DARTHJEE-TENT.md` back-link stay valid because the parent/subfolder relationship is preserved.

### Step 2 — Move the Navi guide under `docs/guides/`

```bash
mkdir -p docs/guides
git mv docs/HOW_TO_USE_NAVI.md docs/guides/HOW_TO_USE_NAVI.md
git mv docs/navi docs/guides/navi
```

Same as Step 1 — no internal link edits needed inside the moved files.

### Step 3 — Update the one internal reference to the Tent doc

`docs/agents/dev-proxy.md` links to the Tent guide by relative path. Update:

```diff
-For a full reference on how Tent works, see [docs/HOW_TO_USE_DARTHJEE-TENT.md](../HOW_TO_USE_DARTHJEE-TENT.md).
+For a full reference on how Tent works, see [docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md](./external/HOW_TO_USE_DARTHJEE-TENT.md).
```

### Step 4 — Update external references to the Navi guide

Update the link target in each of these (all currently point at `docs/HOW_TO_USE_NAVI.md` / `docs/navi/...`, either as a relative path or a full `https://github.com/darthjee/navi/blob/main/...` URL — keep whichever form each file already uses, just repoint the path):

- `README.md` — two links: the top-level "How to Use Navi in Your Project" link, and the "Config splitting" link to `docs/navi/splitting-configuration.md`.
- `DOCKERHUB_DESCRIPTION.md` — the "Integration guide for developers and AI agents" link.
- `source/README.md` — the same "Integration guide for developers and AI agents" link.

All three become `docs/guides/HOW_TO_USE_NAVI.md` (and `docs/guides/navi/splitting-configuration.md` for the README.md config-splitting link).

### Step 5 — Update agent ownership scope docs

- `.claude/agents/docs.md`:
  - In the frontmatter `description` and in "Your scope", replace `docs/HOW_TO_USE_NAVI.md`, `docs/navi/*` with `docs/guides/HOW_TO_USE_NAVI.md`, `docs/guides/navi/*.md`.
  - Add `docs/guides/HOW_TO_USE_NAVI-CLIENT.md` and `docs/guides/navi-client/*.md` to "Your scope" (see Step 6). `clients/node/README.md` stays listed as-is — unchanged owner, unchanged file.
  - Update the "Conventions" bullets that reference `docs/HOW_TO_USE_NAVI.md`/`docs/navi/*.md` by name to the new paths.
- `.claude/agents/architect.md`: update the `docs` row of the specialist table to list the new paths (`docs/guides/HOW_TO_USE_NAVI.md`, `docs/guides/navi/*`, `docs/guides/HOW_TO_USE_NAVI-CLIENT.md`, `docs/guides/navi-client/*`, `DOCKERHUB_DESCRIPTION.md`, `clients/node/README.md`). No new agent is needed for `docs/agents/external/` — it is already covered by architect's existing blanket ownership of `docs/agents/`.

### Step 6 — Write the new `navi-hey-client` guide

Create `docs/guides/HOW_TO_USE_NAVI-CLIENT.md` + `docs/guides/navi-client/*.md`, mirroring the existing `docs/guides/HOW_TO_USE_NAVI.md` + `docs/guides/navi/` pattern: a short main file with an intro + table-of-contents linking into split pages under `./navi-client/`, each split page ending with a `[← Back to How to Use navi-hey-client](../HOW_TO_USE_NAVI-CLIENT.md)` link.

Source material for the content is `clients/node/README.md` (installation, library usage incl. the `NaviClient` constructor-option/method tables, CLI usage incl. the options table, and the link to the `/api` namespace reference) and `docs/agents/client-node.md` for additional internal context — but write this as a standalone integration guide for external consumers, not a copy of the npm README. Suggested split (adjust as the content dictates): `installation.md`, `library-usage.md`, `cli-usage.md`, `reference.md`.

This file's purpose is distinct from `clients/node/README.md` (the npm-facing readme, which stays as-is) — same relationship as `HOW_TO_USE_NAVI.md` vs. the root `README.md` today.

### Step 7 — Sweep for stale references

After the moves and edits above, grep the repo for any remaining `docs/HOW_TO_USE_NAVI`, `docs/navi/`, `docs/tent/`, or `HOW_TO_USE_DARTHJEE-TENT` occurrences outside the moved bundles themselves, and fix any that were missed by Steps 3–4.

## Files to Change

- `docs/HOW_TO_USE_DARTHJEE-TENT.md` → `docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md` (git mv, no content changes)
- `docs/tent/*.md` (12 files) → `docs/agents/external/tent/*.md` (git mv, no content changes)
- `docs/HOW_TO_USE_NAVI.md` → `docs/guides/HOW_TO_USE_NAVI.md` (git mv, no content changes)
- `docs/navi/*.md` (8 files) → `docs/guides/navi/*.md` (git mv, no content changes)
- `docs/guides/HOW_TO_USE_NAVI-CLIENT.md` — new
- `docs/guides/navi-client/*.md` — new (split pages, see Step 6)
- `docs/agents/dev-proxy.md` — update Tent doc link
- `README.md` — update two Navi guide links
- `DOCKERHUB_DESCRIPTION.md` — update Navi guide link
- `source/README.md` — update Navi guide link
- `.claude/agents/docs.md` — update scope (paths + new client-guide entry)
- `.claude/agents/architect.md` — update `docs` row in specialist table

## Notes

- No dedicated CI job covers `docs/` (checked `.circleci/config.yml` — lint jobs only cover `source/`, `dev/app`, `dev/frontend`, `frontend/`, `clients/node`), so no `## CI Checks` section applies here.
- Do not edit any content inside the moved `HOW_TO_USE_DARTHJEE-TENT.md`/`HOW_TO_USE_NAVI.md` bundles beyond what Steps 1–2 do (pure `git mv`) — their internal relative links are correct as-is once the parent/subfolder pair moves together.
- `clients/node/README.md` is unaffected by this issue — it keeps its existing npm-facing content and its existing `docs` ownership.
