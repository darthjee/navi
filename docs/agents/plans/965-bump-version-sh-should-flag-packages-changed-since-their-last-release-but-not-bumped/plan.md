# Plan: bump_version.sh should flag packages changed since their last release but not bumped

Issue: [965-bump-version-sh-should-flag-packages-changed-since-their-last-release-but-not-bumped.md](../../issues/965-bump-version-sh-should-flag-packages-changed-since-their-last-release-but-not-bumped.md)

## Overview
Move the "published files changed but version not bumped" detection out of `scripts/ci/check-and-publish-package.sh` into a shared, sourced helper. Use the helper in CI (behavior unchanged) and in `scripts/bump_version.sh`. Bumping `app` then refuses, unless `--force` is passed, when `worker/` or `logger/` is stale. A new `all` target bumps the app plus every stale package in one run.

## Context
- `scripts/ci/check-and-publish-package.sh` (`check_version_bump`) finds the last release tag with `git describe --tags --abbrev=0 --match="<prefix>*" --match='[0-9]*.[0-9]*.[0-9]*' HEAD^`. It then runs `git diff --quiet <tag>..HEAD -- <folder>/lib <folder>/package.json` and compares the version at the tag (read with `node`) to the current one. It honors `SKIP_BUMP_CHECK=true`.
- `scripts/bump_version.sh [app|client|worker|deku-sprout] [version]` takes 0–2 positional args and edits files with macOS `sed -i ''`. It has no cross-package awareness.
- Packages to check: `worker` (folder `worker`, tag prefix `worker-`) and `deku-sprout` (folder `logger`, tag prefix `deku-sprout-`). `client` is never checked.
- `scripts/` is root-level, with no specialist owner, so the architect implements it. There are no shell spec suites for `scripts/`.

## Steps

- [01 — Extract the shared bump-check helper](plan/01-extract-shared-helper.md)
- [02 — Add the stale-package check, --force and `all` to bump_version.sh](plan/02-bump-version-check-force-all.md)
- [03 — Update the docs](plan/03-update-docs.md)

## Notes
- Untracked files: `git diff <tag> -- <paths>` against the working tree ignores untracked files. A brand-new, never-added file under `lib/` won't be detected locally. This is acceptable: it will be committed (and detected) before the release, and CI still catches it.
- Stale local tags are out of scope (no `git fetch --tags`). If CI-pushed `worker-*` / `deku-sprout-*` tags are missing locally, the helper falls back to an older tag, which can only produce false *stale* reports, never miss a real one. Mention `git fetch --tags` in the refusal message as a hint.
- `README.md` line 25 still describes the removed standalone `deku-sprout-x.y.z` release track (#964). Fix it while touching that section.
- Manual verification: there are no automated shell tests. Run `bash -n` on the changed scripts and try the scenarios listed in step 02 on a scratch branch, reverting the edits afterwards. Running `scripts/ci/check-and-publish-worker.sh` with `DRY_RUN=1` confirms the CI output didn't change.
