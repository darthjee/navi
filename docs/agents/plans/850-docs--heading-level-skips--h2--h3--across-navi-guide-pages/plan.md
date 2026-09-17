# Plan: Docs: heading level skips (h2->h3) across navi guide pages

Issue: [850-docs--heading-level-skips--h2--h3--across-navi-guide-pages.md](../../issues/850-docs--heading-level-skips--h2--h3--across-navi-guide-pages.md)

## Overview

14 pages under `docs/guides/navi/` open with an `h1` title immediately followed by `h3` section headings, skipping `h2` entirely. This breaks Codacy/markdownlint's `MD001` rule and can break generated tables of contents and accessibility tooling. Fix by promoting each affected page's heading levels by one (`h3` → `h2`, nested `h4` → `h3`) so the outline is contiguous, matching the convention already used elsewhere (e.g. `docs/guides/navi/samples.md`). Content/wording is unchanged.

See [docs.md](docs.md) for the full plan.
