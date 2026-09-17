# Plan: Docs: duplicate headings and broken link fragment in agents docs

Issue: [851-docs--duplicate-headings-and-broken-link-fragment-in-agents-docs.md](../issues/851-docs--duplicate-headings-and-broken-link-fragment-in-agents-docs.md)

## Overview

Codacy/markdownlint flags two `MD024` duplicate-heading findings and one `MD051` dead internal link inside `docs/agents/` — all project documentation, owned directly by `architect` (not delegated to a specialist; see `.claude/agents/architect.md`'s scope). Fix is a pure markdown edit: rename two duplicate headings to disambiguate them, and correct one link fragment.

## Context

- `docs/agents/flow/failure-handling.md:3` — the H2 `## Failure Handling` duplicates the file's own H1 title `# Failure Handling` (line 1).
- `docs/agents/web-server.md:494` — the H2 `## Error handling` (`RouteRegister`'s domain-error → HTTP-status mapping) duplicates the H3 `### Error handling` under **Route extensions** (line 313, a malformed-extension-module description) — same text, two unrelated sections.
- `docs/agents/web-server.md:84` — the table cell links `[below](#engine-start-request-and-response)`, intending to reach `### \`/engine/start\` request and response` (line 96). GitHub's heading-slug algorithm strips backticks and `/` without inserting a hyphen, so the heading actually resolves to `#enginestart-request-and-response` (confirmed against this same file's own working pattern: `### \`GET /menu.json\`` → `#get-menujson`, linked correctly at line 541). The link's current target never matches.

## Implementation Steps

### Step 1 — Disambiguate the duplicate heading in `failure-handling.md`

Rename the `## Failure Handling` heading (line 3) to something specific to the retry/cooldown/exhaustion lifecycle it documents (e.g. `## Retry and Exhaustion Lifecycle`), since the file's own H1 (line 1) already carries the generic `Failure Handling` title. Keep the section content unchanged — only the heading text changes. Check for any other file linking to this heading's current anchor (`#failure-handling`, ambiguous today since both H1 and H2 slugify to it) and update it if found.

### Step 2 — Disambiguate the duplicate heading and fix the dead link in `web-server.md`

- Rename the extension-specific `### Error handling` heading (line 313, under **Route extensions**) to something distinct, e.g. `### Extension error handling` — leave the general `## Error handling` (line 494, documenting `RouteRegister`'s mapping) as-is, since it's the more generic/primary use of the term. Check for any other file linking to `#error-handling` and confirm it still resolves to the intended section (the surviving one, line 494) after the rename.
- Fix the dead link at line 84: change `[below](#engine-start-request-and-response)` to point at the correct generated anchor `#enginestart-request-and-response` for the `### \`/engine/start\` request and response` heading (line 96).

## Files to Change

- `docs/agents/flow/failure-handling.md` — rename the duplicate `## Failure Handling` heading (line 3).
- `docs/agents/web-server.md` — rename the duplicate `### Error handling` heading (line 313) and fix the dead link fragment at line 84 to `#enginestart-request-and-response`.

## Notes

- No local CI job runs markdownlint in this repo (`.circleci/config.yml` has no matching job) — the `MD024`/`MD051` gate is enforced by Codacy on the PR, not locally; there's nothing to run beyond a visual check that headings and links resolve correctly.
- Purely a documentation/formatting fix — no code, tests, or other specialists' files are touched.
