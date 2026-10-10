# Use a frozen install in the client PR jobs
Add `frozen: true` to the `install-deps` step of the `jasmine-client` and `checks-client` jobs, so a stale `clients/node/yarn.lock` fails on the PR instead of only at release time in `npm-publish-client`. Leave the other packages' jobs unchanged; they're out of scope.

## Files to Change
- `.circleci/config.yml` — `jasmine-client` and `checks-client`: add `frozen: true` under `install-deps` with `path: clients/node`.
