# Plan: Docs: module-level README indexes + move the config schema out of README (token efficiency)

Issue: [814-docs-module-level-readme-indexes-move-the-config-schema-out-of-readme-token-efficiency.md](../issues/814-docs-module-level-readme-indexes-move-the-config-schema-out-of-readme-token-efficiency.md)

## Overview

Two independent documentation changes shipped together. **Part 1** adds a terse co-located
`README.md` index at the root of each large source tree (`source/lib/`, `worker/lib/`,
`frontend/src/`) so an agent navigating the code gets an immediate map instead of `ls`-ing
and opening files; each index links out to the fuller `docs/agents/` page, and those pages
plus `AGENTS.md` link back. **Part 2** creates one canonical config-schema guide
(`docs/guides/navi/configuration-schema.md`) and removes the ~150-line YAML `Structure` +
`Fields` block from the three places that each ship their own copy today (`README.md`,
`source/README.md`, `DOCKERHUB_DESCRIPTION.md`), replacing each with a short blurb + link.
`docs/guides/navi/prerequisites.md` is deliberately left untouched.

## Agents involved

- [docs](docs.md) — new `configuration-schema.md`; trim `README.md` + `DOCKERHUB_DESCRIPTION.md`; fix the `#fields` link; cross-link the new guide from `how_to_use_navi.md` and `reference.md`
- [engine](engine.md) — new `source/lib/README.md`; trim the schema block in `source/README.md`
- [worker](worker.md) — new `worker/lib/README.md`
- [frontend](frontend.md) — new `frontend/src/README.md`
- [architect](architect.md) — back-links from `docs/agents/architecture/source-layout.md`, `docs/agents/worker.md`, `docs/agents/frontend.md`; note the convention in `AGENTS.md`

The four content areas are independent and can be done in parallel. The only ordering
preference: `docs` creates `configuration-schema.md` first so the others link to a path
that exists — but since every link target is known up front (see Shared contracts), this
is not a hard dependency.

## Shared contracts

### Canonical config-schema guide

- **Path:** `docs/guides/navi/configuration-schema.md` (created by `docs`).
- **Title / headings:** `# Configuration Schema`, then `### Structure` (the YAML example)
  and `### Fields` (the field tables). The `### Fields` heading gives anchor `#fields`.
- **Link to it, by referrer:**
  | Referrer | Owner | Link to use |
  |---|---|---|
  | `README.md` (root) | docs | `docs/guides/navi/configuration-schema.md` (relative) |
  | `README.md` L485 `[Configuration File Fields](#fields)` | docs | `docs/guides/navi/configuration-schema.md#fields` |
  | `docs/guides/how_to_use_navi.md` | docs | `./navi/configuration-schema.md` |
  | `docs/guides/navi/reference.md` | docs | `configuration-schema.md` (sibling) |
  | `DOCKERHUB_DESCRIPTION.md` | docs | `https://github.com/darthjee/navi/blob/main/docs/guides/navi/configuration-schema.md` (absolute — Docker Hub can't resolve relative links) |
  | `source/README.md` | engine | `https://github.com/darthjee/navi/blob/main/docs/guides/navi/configuration-schema.md` (absolute — npm's rendered readme can't resolve relative links) |

### Replacement blurb for a removed schema block

Wherever the `### Structure` + `### Fields` block is removed (`README.md`,
`DOCKERHUB_DESCRIPTION.md`, `source/README.md`), replace it with the same one/two-sentence
pointer, adjusted only for the link form above:

> Navi is configured via a YAML file that defines HTTP clients, resources, and the worker
> pool size. See the [configuration schema](<link>) for the full field-by-field reference.

`README.md` may additionally keep a minimal ~5–10 line YAML skeleton for orientation
(implementer's call); `source/README.md` and `DOCKERHUB_DESCRIPTION.md` should not.

### Co-located README paths and their "See also" targets

| New file | Owner | "See also" link (relative, from the new file) |
|---|---|---|
| `source/lib/README.md` | engine | `../../docs/agents/architecture/source-layout.md` |
| `worker/lib/README.md` | worker | `../../docs/agents/worker.md` |
| `frontend/src/README.md` | frontend | `../../docs/agents/frontend.md` |

### Back-links added by `architect`

| Page | Back-link to add (relative) |
|---|---|
| `docs/agents/architecture/source-layout.md` | `../../../source/lib/README.md` |
| `docs/agents/worker.md` | `../../worker/lib/README.md` |
| `docs/agents/frontend.md` | `../../frontend/src/README.md` |

Each new README is a **terse index of immediate children only** — one line per subfolder /
notable flat file — not a restatement of the `docs/agents/` narrative, and it does not
recurse into nested directories.

## CI Checks

No CI job runs on Markdown-only changes. The always-on `checks*` / `jasmine*` matrix runs
ESLint + Jasmine per package on `.js` only, so new `.md` files under `source/`, `worker/`,
`frontend/` don't affect it (confirm each package's `eslint.config.*` doesn't match `.md`).
`scripts/check_tag_version.sh` / `check_client_tag_version.sh` grep only the **root**
`README.md` for `**Current Version:**` / `**Client Current Version:**` lines, which are
near the top of the file — far from the `## Configuration File` section being edited — and
run only on release tags. `update-description*` pushes `DOCKERHUB_DESCRIPTION.md` to Docker
Hub on release, which is its intended purpose.

## Notes

- The repo has **no** Markdown lint or link-check in CI, contrary to the issue's optimistic
  "CI doc/link checks green" line. Validation is manual: after the change,
  `grep -rn '#fields\|#structure' --include='*.md' .` should surface no dead intra-repo
  anchors, and `#configuration-file` / `#custom-configuration` in root `README.md` must
  still resolve (the `## Configuration File` heading and `### Custom Configuration`
  subsection both stay).
- `### Custom Configuration` in `README.md` is deployment guidance, not schema — it stays
  exactly where it is; its anchor and the two links to it (README L87, L307) are untouched.
- `source/README.md` and `DOCKERHUB_DESCRIPTION.md` also carry their own
  `## Resource Chaining` / `## Paginated Actions` copies. Those are **out of scope** here —
  only the `## Configuration File` (`### Structure` + `### Fields`) block is removed.
- `docs/guides/navi/prerequisites.md` stays as-is: a CI-oriented "minimum viable config"
  walkthrough. The new guide is the exhaustive reference; the two are allowed to coexist.
- The new guide's `### Fields` content is the **superset** of the root `README.md` version
  (more complete on `web.memory` / `web.api` / `emit.size` / `extraction.size`) and
  `prerequisites.md` (more complete on `enabled` / `disabled` / `max_page` / `parser` /
  `emit` and the `parsedBody` / `headers` / `parameters` namespace table). `parser` /
  `emit` are summarized with links to `extraction-configuration.md` /
  `emit-configuration.md`, the same way `prerequisites.md` does — don't re-expand them.
