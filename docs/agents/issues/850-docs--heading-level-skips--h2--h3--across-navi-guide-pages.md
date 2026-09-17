# Issue: Docs: heading level skips (h2->h3) across navi guide pages

## Description
Codacy/markdownlint (`MD001`) flags heading-level skips (h1 → h3, with no h2 in between) across 13 pages under `docs/guides/navi/`. Investigation while discussing this issue found one additional page with the same skip that Codacy's scan did not flag: `docs/guides/navi/warming-html-assets.md:14` (also h1 → h3).

Affected pages:
- `docs/guides/navi/prerequisites.md:3`
- `docs/guides/navi/configuration-schema.md:11`
- `docs/guides/navi/option-a-docker-image.md:10`
- `docs/guides/navi/option-b-nodejs-image.md:5`
- `docs/guides/navi/option-d-hosted-server.md:5`
- `docs/guides/navi/option-e-development-image.md:7`
- `docs/guides/navi/extending-navi.md:9`
- `docs/guides/navi/configuring-the-menu.md:13`
- `docs/guides/navi/extraction-configuration.md:9`
- `docs/guides/navi/emit-configuration.md:5`
- `docs/guides/navi/splitting-configuration.md:7`
- `docs/guides/navi/paginated-actions.md:22`
- `docs/guides/navi/reference.md:6`
- `docs/guides/navi/warming-html-assets.md:14` (found during discussion; not in Codacy's original flagged list)

## Problem
Each affected page opens with an `h1` title immediately followed by `h3` section headings, with no `h2` anywhere in the document. Skipped heading levels can break generated tables of contents and accessibility tooling (e.g. screen readers) that rely on a consistent, non-skipping outline.

## Solution
Normalize each flagged page's heading levels so the outline is contiguous, starting at `h2` right under the `h1` title — promote each top-level section from `h3` to `h2`, and correspondingly promote any nested `h4` under it to `h3` (e.g. `docs/guides/navi/emit-configuration.md` has one `h4` nested under an affected `h3`; `docs/guides/navi/extending-navi.md` and `docs/guides/navi/warming-html-assets.md` similarly have nested headings that need to shift with their parent). This matches the convention already used by unflagged pages in the same folder, e.g. `docs/guides/navi/samples.md` (`h1` → `h2`). No wording or content changes — heading levels only.

## Benefits
- Clears the Codacy/markdownlint `MD001` finding on all 13 originally flagged pages (plus the 14th found during discussion).
- Generated tables of contents and accessibility tooling get a consistent, non-skipping heading outline across all `docs/guides/navi/` pages.
