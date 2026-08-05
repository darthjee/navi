# Issue: reorganize how to use documentation

## Description

Navi's `docs/` folder currently mixes three different kinds of documentation together at the top level: docs about external tools Navi depends on, docs meant for external developers consuming Navi, and internal contributor docs. This issue separates them into clearly named, purpose-specific locations so each audience finds what it needs without wading through the others.

## Problem

- `docs/HOW_TO_USE_DARTHJEE-TENT.md` + `docs/tent/` document an external tool (Tent) that Navi's local dev proxies depend on. This is internal/contributor-facing material, but it currently sits at the `docs/` root alongside consumer-facing guides, with no dedicated home.
- `docs/HOW_TO_USE_NAVI.md` + `docs/navi/` is the integration guide for external developers/AI agents consuming Navi. It has no clearly dedicated, discoverable location either — it's just another file at the `docs/` root.
- There's no equivalent guide yet for the `navi-hey-client` npm package, and no dedicated place to add one alongside `HOW_TO_USE_NAVI.md`.

## Solution

Two distinct audiences are being separated:

- **`docs/agents/external/`** — contributor-facing docs about external tools that Navi itself depends on/uses (currently just Tent, used by the local dev proxies). This lives alongside the rest of `docs/agents/` (internal/contributor-facing material), and needs no new owning agent — it's already covered by `architect`'s existing blanket ownership of `docs/agents/`.
  - `docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md` (main file, at `external/` root) + `docs/agents/external/tent/*.md` (split pages) — moved as a unit from `docs/HOW_TO_USE_DARTHJEE-TENT.md` + `docs/tent/`, preserving the exact same parent-file/sibling-subfolder relative-link structure (main file uses `./tent/*.md`, split pages use `../HOW_TO_USE_DARTHJEE-TENT.md`).
  - A future second external tool would add its own `external/HOW_TO_USE_<TOOL>.md` + `external/<tool>/*.md` pair, flat under `external/` — no extra wrapper folder per tool.

- **`docs/guides/`** — docs Navi wants *other developers* (its consumers) to read, i.e. external-developer-facing integration guides. Same main-file + split-folder structure as today:
  - `docs/guides/HOW_TO_USE_NAVI.md` + `docs/guides/navi/*.md` — moved from `docs/HOW_TO_USE_NAVI.md` + `docs/navi/*.md`.
  - `docs/guides/HOW_TO_USE_NAVI-CLIENT.md` + `docs/guides/navi-client/*.md` — new, and separate in purpose from `clients/node/README.md` (the npm-facing readme), same as `HOW_TO_USE_NAVI.md` is separate from the root `README.md` today.

**Design principle — relative links stay relative:** `HOW_TO_USE_*.md` files and their split-page subfolders use relative links deliberately (`./<folder>/*.md` forward, `../HOW_TO_USE_*.md` back) so the whole main-file + subfolder bundle can be copied into any other project/folder as a self-contained unit. Every move in this issue must preserve that structure exactly — only the *parent* location of each bundle changes, never the relative links inside it.

**Agent ownership updates:**
- `.claude/agents/docs.md`: update its scope list — replace `docs/HOW_TO_USE_NAVI.md`, `docs/navi/*` with `docs/guides/HOW_TO_USE_NAVI.md`, `docs/guides/navi/*.md`, and add `docs/guides/HOW_TO_USE_NAVI-CLIENT.md`, `docs/guides/navi-client/*.md`. `clients/node/README.md` stays as-is (unchanged owner) — this follows the existing precedent that `docs` owns `clients/node/README.md` even though `navi-client` owns the package code, so the new client guide stays with `docs` for the same reason, not `navi-client`.
- `.claude/agents/architect.md`: update the `docs` row in the specialist table to match the new paths.

**Link updates (external references, outside the moved bundles):**

| File | Old link | New link |
|---|---|---|
| `README.md` | `docs/HOW_TO_USE_NAVI.md` (GitHub blob URL) | `docs/guides/HOW_TO_USE_NAVI.md` |
| `README.md` | `docs/navi/splitting-configuration.md` (GitHub blob URL) | `docs/guides/navi/splitting-configuration.md` |
| `DOCKERHUB_DESCRIPTION.md` | `docs/HOW_TO_USE_NAVI.md` (GitHub blob URL) | `docs/guides/HOW_TO_USE_NAVI.md` |
| `source/README.md` | `docs/HOW_TO_USE_NAVI.md` (GitHub blob URL) | `docs/guides/HOW_TO_USE_NAVI.md` |
| `docs/agents/dev-proxy.md` | `../HOW_TO_USE_DARTHJEE-TENT.md` (relative link) | `./external/HOW_TO_USE_DARTHJEE-TENT.md` |

## Benefits

- Clear separation between docs about external dependencies, docs for Navi's own consumers, and internal contributor docs — each audience finds the right material without noise from the others.
- A consistent, repeatable pattern (`external/HOW_TO_USE_<X>.md` + `external/<x>/*.md`, `guides/HOW_TO_USE_<X>.md` + `guides/<x>/*.md`) for adding future external-tool docs or consumer guides.
- The `navi-hey-client` package finally gets a dedicated integration guide, matching what already exists for Navi itself.
