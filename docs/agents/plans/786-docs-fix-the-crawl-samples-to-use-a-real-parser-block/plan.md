# Plan: docs: fix the crawl samples to use a real parser: block

Issue: [786-docs-fix-the-crawl-samples-to-use-a-real-parser-block.md](../../issues/786-docs-fix-the-crawl-samples-to-use-a-real-parser-block.md)

## Overview

Documentation-only. The three crawl recipes under `docs/guides/navi/samples/` and the
**Crawling** blurbs in `docs/guides/navi/samples.md` show `emit:`-only configs and describe
extraction as automatic, which is false — a `parser:` block is required or nothing is
extracted or emitted. This plan adds a required `json_path` parser (root-array form, `match`
omitted) with a near-identity `fields:` map to each recipe, rewrites each "What happens"
walkthrough to credit the parser for extraction, links each recipe to
`docs/guides/navi/extraction-configuration.md`, and updates the `samples.md` Crawling blurbs.

Single owner: `docs`. See [docs.md](docs.md) for the full plan.
