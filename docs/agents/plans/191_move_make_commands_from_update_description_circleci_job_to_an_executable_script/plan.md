# Plan: Move make commands from update-description CircleCI job to an executable script

## Overview

The `update-description` CircleCI job runs in a container (`darthjee/scripts:0.6.0`) that does not have `make` installed.
The job currently calls `make update-description`, which expands to a single `sh` command.
This plan extracts that command into a standalone shell script and updates the CircleCI job to call it directly.

## Context

The `update-description` Makefile target (line 64–65 in `Makefile`) expands to:

```sh
/bin/sh /home/scripts/sbin/docker_hub.sh login_and_push_description darthjee/navi DOCKERHUB_DESCRIPTION.md
```

Where:
- `/home/scripts/sbin/docker_hub.sh` — a script provided by the `darthjee/scripts:0.6.0` Docker image.
- `darthjee/navi` — the Docker Hub image name (`PROD_IMAGE` in the Makefile).
- `DOCKERHUB_DESCRIPTION.md` — the description file at the repo root.

The CircleCI job (`.circleci/config.yml`, lines 156–163) currently calls `make update-description`, which fails because `make` is not available in that container.

## Implementation Steps

### Step 1 — Create `scripts/update-description.sh`

Create a new shell script at `scripts/update-description.sh` with the content extracted from the Makefile target:

```sh
#!/bin/sh
/bin/sh /home/scripts/sbin/docker_hub.sh login_and_push_description darthjee/navi DOCKERHUB_DESCRIPTION.md
```

Ensure the script has execution permissions (`chmod +x scripts/update-description.sh`).

### Step 2 — Update the CircleCI job

In `.circleci/config.yml`, replace the `make update-description` command in the `update-description` job with a direct call to the script:

```yaml
- run:
    name: Update Docker Hub description
    command: sh scripts/update-description.sh
```

## Files to Change

- `scripts/update-description.sh` — new file; contains the shell command previously hidden behind `make update-description`.
- `.circleci/config.yml` — update the `update-description` job step to call `sh scripts/update-description.sh` instead of `make update-description`.

## Notes

- The `Makefile` target `update-description` can be kept as-is (it still works locally where `make` is available) or updated to delegate to the script — either option is acceptable. The Makefile is not the root cause of the CI failure.
- No changes are needed to `DOCKERHUB_DESCRIPTION.md` or to the `darthjee/scripts:0.6.0` image.
