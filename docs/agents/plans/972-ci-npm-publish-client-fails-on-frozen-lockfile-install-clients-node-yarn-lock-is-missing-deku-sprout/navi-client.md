# Navi Client Plan: CI: npm-publish-client fails on frozen-lockfile install — clients/node/yarn.lock is missing deku-sprout

Main plan: [plan.md](plan.md)

## Overview
`npm-publish-client` runs `yarn install --frozen-lockfile` in `clients/node/` and fails because `clients/node/yarn.lock` has no `deku-sprout` entry. This plan fixes the dependency range and the lockfile, hardens the client's PR jobs, and bumps the client version so the fix can be released as `client-0.2.4`.

## Context
- #924 (`bb37eeb`) added `"deku-sprout": "^0.1.0"` to `clients/node/package.json` without touching `clients/node/yarn.lock`.
- `jasmine-client` / `checks-client` use `install-deps` with the default `frozen: false`, so they regenerate the lockfile in CI and pass.
- `^0.1.0` on a 0.x version only matches `0.1.x`; the in-repo `logger/` is at `0.3.0` (published to npm). `logger/lib` is identical between 0.1.0 and 0.3.0, and the client only imports `{ Logger }`.
- `navi-hey-client@0.2.3` was never published (npm has up to `0.2.2`); the `client-0.2.3` tag is left alone.

## Steps

- [01 — Bump deku-sprout range](navi-client/01-bump-deku-sprout-range.md)
- [02 — Regenerate the lockfile](navi-client/02-regenerate-lockfile.md)
- [03 — Use a frozen install in the client PR jobs](navi-client/03-frozen-install-in-pr-jobs.md)
- [04 — Bump the client to 0.2.4](navi-client/04-bump-client-version.md)

## CI Checks
- `clients/node`: `cd clients/node && yarn install --frozen-lockfile && npm run coverage` (CI job: `jasmine-client`)
- `clients/node`: `cd clients/node && yarn install --frozen-lockfile && npm run lint` (CI job: `checks-client`)

## Notes
- Steps 03 and 04 touch root-level files (`.circleci/config.yml`, `README.md`) that are outside `navi-client`'s folder; the architect applies or reviews those changes.
- Pushing the `client-0.2.4` tag after merge is a manual release action and is not part of this plan.
- Making the other packages' PR install jobs use a frozen install is out of scope.
