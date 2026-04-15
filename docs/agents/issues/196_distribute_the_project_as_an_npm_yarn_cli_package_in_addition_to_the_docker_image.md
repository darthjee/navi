# Issue: Distribute the Project as an npm/yarn CLI Package in Addition to the Docker Image

## Description

Currently, the project is released only as a Docker image. To expand distribution options, the project should also be available as an npm package invocable via `npx navi` — following the same pattern as tools like `jasmine`. Only `lib/` and `bin/` should be included in the published package; `spec/` must be excluded.

## Problem

- Distribution is limited to Docker, which excludes pipelines that prefer npm/yarn-managed dependencies.
- There is no `navi` CLI command available via package managers.
- Updates require pulling a new Docker image rather than running a simple package manager upgrade.

## Expected Behavior

- Users can run `npx navi` directly, without installing the package globally — following the same usage pattern as `jasmine`.
- The published npm package includes only `lib/` and `bin/` directories; `spec/` is excluded (e.g., via `files` field in `package.json`).
- `bin/navi.js` serves as the CLI entrypoint, declared in `package.json`'s `bin` field.
- The Docker image installs the published package (e.g., via `yarn install`) instead of copying source code directly.
- Documentation describes the new installation and usage options.

## Solution

- Configure `package.json`:
  - Add a `bin` field pointing `navi` to `bin/navi.js`.
  - Add a `files` field listing only `lib/` and `bin/` to exclude `spec/` and other non-essential files from the published package.
- Ensure `bin/navi.js` has the proper shebang (`#!/usr/bin/env node`) and serves as the CLI entrypoint.
- Publish the package on both npm and yarn registries.
- Add a publication step to `.circleci/config.yml` to automate package publishing as part of the CI/CD pipeline.
- Update the Dockerfile to install from the published package instead of copying source directly.
- Update documentation to cover both Docker and `npx navi` usage options.

## Benefits

- Broader integration options for pipelines that prefer npm/yarn-managed dependencies.
- Easier updates via package managers (both npm and yarn).
- Automated publishing via CircleCI removes manual release steps.
- Retains Docker distribution while following best practices (install from a published package).

---
See issue for details: https://github.com/darthjee/navi/issues/196
