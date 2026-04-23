# Issue: Rename npm Package

## Description
The npm package name `navi` is already taken, so the package must be renamed to `navi-hey` before a new release can be published. The Docker image name must be updated accordingly as well.

## Problem
- The npm package name `navi` is already occupied by another package on the registry.
- Publishing a new release under the current name is blocked.
- The Docker image reference may also need to be updated to stay consistent with the new package name.

## Expected Behavior
- The npm package is published under the name `navi-hey`.
- The Docker image is updated to reference `navi-hey`.
- All internal references (package.json, documentation, CI configuration) reflect the new name.

## Solution
- Rename the `name` field in `package.json` from `navi` to `navi-hey`.
- Update the Docker image name/tag from `navi` to `navi-hey` wherever it appears (Dockerfiles, docker-compose files, Makefile, CI pipelines).
- Update any documentation or README references to the package name.

## Benefits
- Unblocks npm releases by using an available package name.
- Keeps the npm package and Docker image names consistent.

---
See issue for details: https://github.com/darthjee/navi/issues/312
