# Rework the CircleCI release jobs

In `.circleci/config.yml`:

**Workflow.**
- Remove the `check-and-publish-worker`, `check-and-publish-deku-sprout` and `npm-publish` entries.
- Add these four entries, all with `filters: *version-tag-filters`:
  - `release-deku-sprout`: `requires: [<release gate>]`;
  - `release-deku-swarm`: `requires: [<release gate>]`;
  - `release-navi-hey`: `requires: [<release gate>, release-deku-sprout, release-deku-swarm]`;
  - `release-navi-hey-client`: `requires: [<release gate>, release-deku-sprout]`.
- `<release gate>` is written out in full in each list (YAML anchors can't merge sequences): `check-version-tag`, `validate-release-yml`, `cascade-bump-check`, every `jasmine*` and `checks*` test job, `smoke-extensions` and `test-extension-harness`.
- `build-and-release`: `requires: [release-navi-hey]`.

The `requires` lists must mirror `release.yml`'s `depends_on`. Add a short YAML comment above the release entries saying so.

**Job definitions.**
- Remove `check-and-publish-worker`, `check-and-publish-deku-sprout` and `npm-publish`.
- Add:
  - `release-deku-sprout`, `release-deku-swarm`, `release-navi-hey-client`: `executor: node-ci`, `checkout`, then a single `run` step: `scripts/ci.sh release-npm <pkg>`.
  - `release-navi-hey`: `executor: node-ci`, `checkout`, `install-deps` (`path: source`, `frozen: true`), `run: scripts/ci.sh build-frontend`, `run: scripts/ci.sh pin-local-deps`, `run: scripts/ci.sh release-npm navi-hey`. The dependency and self waits now live in the script.
- Leave `build-and-release-client` / `update-description-client` unwired.

Validate with `circleci config validate` if available, or a YAML parse. Grep the repo (excluding `docs/agents/issues/`, `docs/agents/plans/` and `docs/agents/specs/`) for leftover `check-and-publish` / `npm-publish` references; step 04 handles the docs.

## Files to Change
- `.circleci/config.yml` — workflow entries and job definitions as above.
