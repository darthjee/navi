# 86: Add Tests Suite for new-dev Node.js Container

<https://github.com/darthjee/navi/issues/86>

## Background

The new development backend (`new-dev/`) is a Node.js Express application that serves dynamic
endpoints based on a YAML file. While the main application in `source/` already has a
comprehensive test suite (Jasmine, c8 coverage, ESLint, JSCPD) running in CI via `jasmine` and
`checks` jobs, the Express dev server currently lacks automated tests.

To ensure reliability and parity with the main project, we need to add the same suite to
`new-dev/` and integrate it into CircleCI as two dedicated jobs: `jasmine-dev` and `checks-dev`.

## Task

- Set up Jasmine + c8 tests with coverage for `new-dev/app.js`.
- Add ESLint linting for `new-dev/`.
- Add JSCPD duplication report for `new-dev/`.
- Add the following scripts to `new-dev/package.json`:
  - `yarn test` — runs tests with c8 coverage (text + html reporters)
  - `yarn coverage` — runs tests with lcov reporter (for Codacy upload)
  - `yarn lint` — runs ESLint
  - `yarn report` — runs JSCPD
- Add `jasmine-dev` and `checks-dev` jobs to `.circleci/config.yml`:
  - `jasmine-dev`: install deps → run coverage → upload to Codacy
  - `checks-dev`: install deps → lint → JSCPD report

## Requirements

- Use Jasmine (same version as main project) and supertest for HTTP assertions.
- Use c8 for coverage, configured to include `app.js` and exclude `spec/`.
- Use ESLint with the same standard config as the main project.
- Use JSCPD for duplication reports.
- Place test files under `new-dev/spec/`.
- Refactor `app.js` to export the Express app without calling `listen`; add `server.js` as entry point.

## Acceptance Criteria

- [ ] All endpoints in `new-dev/app.js` are covered by automated tests (happy path + 404s).
- [ ] `yarn test` inside `new-dev/` runs Jasmine with c8 coverage and passes.
- [ ] `yarn coverage` produces an lcov report.
- [ ] `yarn lint` passes with no errors.
- [ ] `yarn report` runs JSCPD duplication check.
- [ ] CircleCI `jasmine-dev` job runs tests and uploads coverage to Codacy.
- [ ] CircleCI `checks-dev` job runs lint and JSCPD report.
- [ ] `app.js` exports the Express app; `server.js` calls `listen`.
