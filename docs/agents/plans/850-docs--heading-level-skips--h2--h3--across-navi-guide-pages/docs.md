# docs Plan: Docs: heading level skips (h2->h3) across navi guide pages

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Promote heading levels in each affected page

Each of the 14 pages listed below opens with an `h1` title immediately followed by `h3` section headings, with no `h2` anywhere in the document (confirmed by grepping `^#` in every page). Promote every heading in each page by exactly one level: `h3` → `h2`, and any nested `h4` under a promoted `h3` → `h3`, so the top-level sections sit directly under the `h1` with no gap. This matches the convention already used by unflagged pages in the same folder, e.g. `docs/guides/navi/samples.md` (`h1` → `h2` directly).

No wording, ordering, or content changes — heading levels (the `#` prefix) only. Code fences and inline text starting with `#` (e.g. shell comments inside fenced code blocks) must be left untouched — verify each match is an actual Markdown heading line, not a comment inside a code block, before editing (`extending-navi.md` and `warming-html-assets.md` in particular contain fenced code blocks with `#`-prefixed comment lines that are not headings).

Files with nested `h4` headings that also need to shift (verify current levels before editing, since promoting must cascade to every heading in the file, not just the first skip):
- `docs/guides/navi/emit-configuration.md` — one `h4` (`#### Example — toggling emit per environment`) nested under a promoted `h3`.
- `docs/guides/navi/extending-navi.md` — several `h4`s nested under promoted `h3`s (verify against current file content).
- `docs/guides/navi/warming-html-assets.md` — several `h4`s nested under one promoted `h3`.

After editing, re-run a heading-level-skip check (e.g. grep `^#+` per file and confirm no level jumps by more than 1) across all 14 files to confirm no skips remain, and spot-check that no fenced-code `#`-comment lines were mistakenly changed.

## Files to Change
- `docs/guides/navi/prerequisites.md` — promote `h3` → `h2`.
- `docs/guides/navi/configuration-schema.md` — promote `h3` → `h2`, `h4` → `h3` where applicable.
- `docs/guides/navi/option-a-docker-image.md` — promote `h3` → `h2`.
- `docs/guides/navi/option-b-nodejs-image.md` — promote `h3` → `h2`.
- `docs/guides/navi/option-d-hosted-server.md` — promote `h3` → `h2`.
- `docs/guides/navi/option-e-development-image.md` — promote `h3` → `h2`.
- `docs/guides/navi/extending-navi.md` — promote `h3` → `h2`, `h4` → `h3` where applicable (watch for `#`-prefixed comment lines inside fenced code blocks — do not touch those).
- `docs/guides/navi/configuring-the-menu.md` — promote `h3` → `h2`.
- `docs/guides/navi/extraction-configuration.md` — promote `h3` → `h2`.
- `docs/guides/navi/emit-configuration.md` — promote `h3` → `h2`, `h4` → `h3`.
- `docs/guides/navi/splitting-configuration.md` — promote `h3` → `h2`.
- `docs/guides/navi/paginated-actions.md` — promote `h3` → `h2`.
- `docs/guides/navi/reference.md` — promote `h3` → `h2`.
- `docs/guides/navi/warming-html-assets.md` — promote `h3` → `h2`, `h4` → `h3` (watch for `#`-prefixed comment lines inside fenced code blocks — do not touch those).

## Notes
- `docs/guides/navi/warming-html-assets.md` was not in Codacy's original flagged list on the GitHub issue but has the identical skip (confirmed during issue discussion); included here since it's the same root cause and fix.
- No other pages under `docs/guides/` (root guides, `navi-client/`, `deku-swarm/`) have this skip — checked during issue discussion, so scope is confined to these 14 `docs/guides/navi/` pages.
- No local lint command exists for this check — it's caught by Codacy's cloud markdownlint scan (`MD001`), not a repo CI job, so there is no `## CI Checks` section here.
