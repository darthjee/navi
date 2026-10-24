# Release config and CircleCI

Point the release config and CI jobs at the new folder, and rename the jobs to match `*-deku-sprout`.

- `release.yml`: `deku-swarm.folder: worker` becomes `folder: deku-swarm`.
- `.circleci/config.yml`:
  - Rename the job definitions `jasmine-worker` / `checks-worker` to `jasmine-deku-swarm` / `checks-deku-swarm`, and their `path: worker` entries (4 in total) to `path: deku-swarm`.
  - Rename the workflow entries and every `requires:` list that names them: `coverage-final`, `release-deku-sprout`, `release-deku-swarm`, `release-navi-hey`, `release-navi-hey-client`, and any later job.

## Files to Change
- `release.yml` — `folder`.
- `.circleci/config.yml` — job names, `path:` params, `requires:` lists.
