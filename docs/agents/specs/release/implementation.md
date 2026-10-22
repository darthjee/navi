# Implementation

[Back to the release spec](../release.md)

Ordered list of the implementation sub-issues to create under #977.

1. **Add `release.yml` and its validator.**
   - Scope: the root dependency tree described in [Packages](packages.md#dependency-tree-releaseyml), plus a script checking its `depends_on` against each `package.json`, run in CI.
   - Owner: architect (`scripts/`, root files).
   - Depends on: none.
2. **Cascade-bump test in CI.**
   - Scope: a script reading `release.yml` that fails when a bumped package's dependents were not bumped; a CI job on PR branches and `X.Y.Z` tags.
   - Owner: architect (`scripts/`, `.circleci/config.yml`).
   - Depends on: 1.
3. **Restrict CI triggers to `X.Y.Z` and branches.**
   - Scope: tests run on branches and `X.Y.Z` tags only; remove the `client-` pipeline (`check-client-version-tag`, `npm-publish-client`, `build-and-release-client`, `update-description-client` on `client-` tags) and the `deku-sprout`/`worker` tag ignore.
   - Owner: architect (`.circleci/config.yml`).
   - Depends on: none.
4. **Generalize per-package npm release jobs.**
   - Scope: one always-run job per npm package (`deku-sprout`, `deku-swarm`, `navi-hey`, `navi-hey-client`), publishing when the version is not on npm, in dependency order from `release.yml`; tag pushing moves out of `check-and-publish-package.sh`.
   - Owner: architect (`scripts/ci/`, `.circleci/config.yml`).
   - Depends on: 1, 3.
5. **Docker image release jobs and the extra jobs.**
   - Scope: always-run jobs for `darthjee/navi-hey` and `darthjee/navi-hey-client`, releasing when the image tag is not on Docker Hub; `update-description`, the demo, demo-app and navi-hey-test jobs act only when `darthjee/navi-hey` released, `update-description-client` only when `darthjee/navi-hey-client` did.
   - Owner: architect (`scripts/`, `.circleci/config.yml`), with `docker` for any Dockerfile or `Makefile` change.
   - Depends on: 4.
6. **Separate tag-push job with the new prefixes.**
   - Scope: push `sprout-<v>`, `swarm-<v>` and `node_client-<v>` after their package released; update `scripts/lib/package_bump_check.sh` for the new prefixes.
   - Owner: architect (`scripts/`, `.circleci/config.yml`).
   - Depends on: 4.
7. **User-facing docs update.**
   - Scope: describe the new release flow and tags wherever the user-facing docs mention releases or the `client-` tag.
   - Owner: docs.
   - Depends on: 3 to 6.

The cleanup sub-issue (#980) comes last, after every sub-issue above is merged: it removes `docs/agents/specs/release.md` and `docs/agents/specs/release/` and drops the release row from `docs/agents/specs.md`.
