# Plan: Remove the deku-sprout specs from docs/agents/specs

Issue: [917-remove-the-deku-sprout-specs-from-docs-agents-specs.md](../../issues/917-remove-the-deku-sprout-specs-from-docs-agents-specs.md)

## Overview
This is the last sub-issue of #888. Now that `deku-sprout` is extracted, released and linked (#911–#916 are closed), its temporary design specs are deleted. Before that, `docs/agents/logger.md` is rewritten into a full permanent subsystem doc, like `docs/agents/worker.md`. Every file that still links to the specs, or still says the package isn't built yet, is updated. `docs/agents/specs/` itself stays, since it still holds `crawler`.

## Agents involved

- [architect](architect.md): owns `docs/agents/`, `.claude/agents/` and `AGENTS.md`, so it does most of the work
- [docs](docs.md): owns `logger/README.md`

## Shared contracts

These are facts about `deku-sprout` as it is on `main`. Both agents must write them the same way. They come from the code, not from the specs, and the specs are out of date on several of them.

- Package: `deku-sprout`, folder `logger/`, current version `0.1.0` (`logger/package.json`). It is published to npm, and `files` ships only `lib`.
- Public API (`logger/lib/index.js`): `BaseLogger`, `ConsoleLogger`, `LoggerGroup`, `Logger`.
- Consumers:
  - `source/` and `dev/app` use `"deku-sprout": "file:../logger"`.
  - `clients/node/` uses the published `"deku-sprout": "^0.1.0"`.
  - The Navi-specific classes (`Log`, `LogContext`, `LogFactory`, `LogFilter`, `buffer/`) stay in `source/lib/common/utils/logging/`. There, `BufferedLogger` extends `deku-sprout`'s `BaseLogger`.
- Release flow:
  - CircleCI jobs: `jasmine-deku-sprout`, `checks-deku-sprout`, and `check-and-publish-deku-sprout` (`scripts/ci.sh check-and-publish-deku-sprout`, `scripts/ci/check-and-publish-deku-sprout.sh`).
  - Pipeline parameter: `force_deku_sprout_build`.
  - A standalone tag workflow runs `check-deku-sprout-version-tag` (`scripts/check_deku_sprout_tag_version.sh`), then `publish-deku-sprout-standalone`.
  - Tags: `deku-sprout-X.Y.Z` (#923 decoupled these from the main `navi-hey` release tag).
  - Version bump: `scripts/bump_version.sh deku-sprout [version]`. It also rewrites the `**Deku Sprout Current Version:**` / `**Deku Sprout Next Version:**` lines in `README.md`.
  - The spec's `logger-X.Y.Z` tags, `logger` bump target and `*-logger` job names are **wrong**. Use the names above.
