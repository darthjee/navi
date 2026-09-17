# Issue: Docs: duplicate headings and broken link fragment in agents docs

## Description
Codacy/markdownlint flags two structural issues in the `docs/agents/` documentation: two pairs of duplicate headings (`MD024`) and one broken internal link fragment (`MD051`).

## Problem
- `docs/agents/flow/failure-handling.md:3` — the H2 `## Failure Handling` duplicates the file's own H1 title `# Failure Handling` (line 1). Same text at two heading levels is ambiguous for anchor links and screen readers.
- `docs/agents/web-server.md:494` — the H2 `## Error handling` (documenting `RouteRegister`'s domain-error → HTTP-status mapping) duplicates the H3 `### Error handling` under **Route extensions** (line 313, documenting how a malformed extension module is skipped). Same text, two unrelated sections.
- `docs/agents/web-server.md:84` — the table cell links `[below](#engine-start-request-and-response)`, intending to point at the `### \`/engine/start\` request and response` heading (line 96). GitHub's heading-slug algorithm strips backticks and the `/` character without inserting a hyphen for them, so the heading actually resolves to anchor `#enginestart-request-and-response` (confirmed against this file's own working pattern — e.g. `### \`GET /menu.json\`` resolves to `#get-menujson`, linked correctly elsewhere in the same file at line 541). The link's target, `#engine-start-request-and-response`, never matches, so it's a dead internal link.

## Solution
- In `failure-handling.md`, rename the `## Failure Handling` section heading (line 3) to something specific to its content (the retry/cooldown/exhaustion lifecycle it describes), since the file's own H1 already carries the generic title.
- In `web-server.md`, rename one of the two `Error handling` headings to disambiguate — e.g. keep `## Error handling` (line 494) for the general `RouteRegister` status-code mapping, and rename the extension-specific one (line 313) to something like `### Extension error handling`.
- In `web-server.md:84`, fix the dead link — either point it at the correct generated anchor (`#enginestart-request-and-response`) or reword the target heading's text so the slug is less surprising. Exact wording is left to whoever implements this.

## Benefits
Anchor links resolve unambiguously, deep links into these docs no longer silently point at the wrong section or nowhere, and the Codacy/markdownlint gate (`markdownlint_MD024`, `markdownlint_MD051`) passes.
