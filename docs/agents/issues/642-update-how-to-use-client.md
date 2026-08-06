# Issue: Update how to use client

## Description
In PR #641 (fixing #632, commit `555ea7b1f6ed74e9e0e6067f87a31cdd9e6cafd2`) we added file/YAML-based config loading to `navi-hey-client` (`configFromFiles`/`configFromJson`/`configFromYaml` in the library, `--file`/`--json`/`--yaml` in the CLI). That PR already updated the detailed sub-guides — `docs/guides/navi-client/cli-usage.md`, `docs/guides/navi-client/library-usage.md`, and `docs/guides/navi-client/reference.md` — with full documentation of the new feature. What it missed is the top-level entry point, `docs/guides/HOW_TO_USE_NAVI-CLIENT.md`, which still reads as if the feature doesn't exist.

## Solution
- Add a mention of the "load config directly from YAML/JSON files" capability to `docs/guides/HOW_TO_USE_NAVI-CLIENT.md`, worked into the page's existing description of what the client does — **not** as a "What's New"/changelog-style callout. A first-time reader has no prior version to compare against, so the capability should just read as one of the things the client can do.
- Include both a minimal library example (`configFromFiles(['./config/reports.yml'])`) and a minimal CLI example (`--file`/`--yaml`/`--json` flags), since readers may be using either.
- Note the minimum `navi-hey-client` version that supports it (`>= 0.1.1`, the version this shipped in) — readers who pin/lock an older client version in their own project won't have this capability, and should know why if they try it and it's not there.
- Keep the top-level page a thin index: the detailed content already lives in — and should stay in — the linked sub-guides under `docs/guides/navi-client/`. This addition is a short blurb + two tiny examples, not a duplication of the full documentation.

**Out of scope:** no broader doc-audit or "keep top-level pages in sync with sub-guides" process is being introduced here — this issue is scoped to this one page.
