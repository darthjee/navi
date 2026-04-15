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
- Initially, only the API (Express) is functional via the CLI; the web UI (React frontend) is not included in this release and will be bundled in a future issue.
- The Docker image installs the published package (e.g., via `yarn install`) instead of copying source code directly.
- Documentation describes the new installation and usage options.

## Solution

- Configure `package.json`:
  - Add a `bin` field pointing `navi` to `bin/navi.js`.
  - Add a `files` field listing only `lib/` and `bin/` to exclude `spec/` and other non-essential files from the published package.
  - Remove `react`, `react-dom`, and related packages from `dependencies` for now — the frontend is not included in this release.
- `bin/navi.js` already exists with the correct shebang (`#!/usr/bin/env node`) and serves as the CLI entrypoint.
- Publish the package on npmjs.com (available to both npm and yarn users from the same registry).
- Add a dedicated `npm-publish` job to `.circleci/config.yml`:
  - Runs only on version tags matching `\d+\.\d+\.\d+` (same filter as `build-and-release`), ignoring branches.
  - Requires all test and check jobs to pass before running.
  - Runs as a separate job alongside `build-and-release`, not merged into it.
- Update the Dockerfile to install from the published package instead of copying source directly.
- Update documentation to cover both Docker and `npx navi` usage options.

## Benefits

- Broader integration options for pipelines that prefer npm/yarn-managed dependencies.
- Easier updates via package managers (both npm and yarn).
- Automated publishing via CircleCI removes manual release steps.
- Retains Docker distribution while following best practices (install from a published package).

---
See issue for details: https://github.com/darthjee/navi/issues/196
