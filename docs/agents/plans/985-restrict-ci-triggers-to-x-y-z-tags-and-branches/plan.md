# Plan: Restrict CI triggers to `X.Y.Z` tags and branches

Issue: [985-restrict-ci-triggers-to-x-y-z-tags-and-branches.md](../../issues/985-restrict-ci-triggers-to-x-y-z-tags-and-branches.md)

## Overview

Make CircleCI run on every branch and only on `X.Y.Z` tags. To do that, replace the `all-tags` filter anchor, then remove the `client-` tag pipeline from the workflow. Delete the npm side of that pipeline (two jobs and one script). Keep the two client image job definitions, unwired, so #987 can reuse them. Update the agent docs that describe the old client flow.

## Context

- Part of Epic #977. The spec lives in `docs/agents/specs/release/tags.md` and `ci-flow.md`.
- Today, `.circleci/config.yml` has three filter anchors:
  - `all-tags`: `only: /.*/` with `ignore: /^(deku-sprout|worker)-.*/`, on every test job;
  - `version-tag-filters`: `X.Y.Z` tags only, no branches;
  - `client-tag-filters`: `client-X.Y.Z` tags only.
- CircleCI tag/branch regexes must match the whole string, so `/\d+\.\d+\.\d+/` already rejects `client-1.2.3`. The new filter still anchors explicitly (`/^\d+\.\d+\.\d+$/`) for clarity.
- Until #986/#987 add the new release jobs, `navi-hey-client` cannot be released. The issue accepts this gap.

## Steps

- [01 — Rework the tag filters](plan/01-rework-tag-filters.md)
- [02 — Remove the client- pipeline](plan/02-remove-client-pipeline.md)
- [03 — Update agent docs](plan/03-update-agent-docs.md)

## CI Checks

- `.circleci/config.yml`: `circleci config validate` (if the CLI is available) or a YAML parse, e.g. `ruby -ryaml -e 'YAML.load_file(".circleci/config.yml", aliases: true)'`. No CI job validates the config itself; CircleCI rejects an invalid config on push.

## Notes

- Keep the anchor name `all-tags` (or rename it to something like `test-filters`) as long as every test job's `filters: *…` reference is updated consistently. Renaming is clearer, since it no longer means "all tags".
- `build-and-release-client` still strips a `client-` prefix from `$CIRCLE_TAG`. Leave that for #987, which will rewire it.
- `docs/agents/specs/release/overview.md` describes the old flow on purpose. Do not edit it. The user-facing docs are #989's job.
- The README "Client Current Version" check disappears with the script. `docs/agents/specs/release/gaps.md` already records this as an open gap. Leave it there.
