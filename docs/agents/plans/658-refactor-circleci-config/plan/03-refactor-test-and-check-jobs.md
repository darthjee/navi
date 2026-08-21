# Refactor test/check jobs to use executors and commands

Rewrite the eight jobs that follow the plain install→test→coverage or install→lint→report pattern (no dev-specific setup) to use the `node-ci` executor and the `install-deps`/`run-tests`/`lint-and-report` commands from step 2, instead of repeating the Docker image and step bodies inline.

Jobs in scope: `jasmine`, `checks`, `jasmine-dev-frontend`, `checks-dev-frontend`, `checks-frontend`, `jasmine-frontend`, `jasmine-client`, `checks-client`, `jasmine-worker`, `checks-worker`.

Example (`jasmine`, before → after):

```yaml
# before
jasmine:
  docker:
    - image: darthjee/circleci_node:0.2.1
  steps:
    - checkout
    - run:
        name: Install dependencies
        command: cd source; yarn install
    - run:
        name: Unit tests (Jasmine)
        command: cd source; npm run coverage
    - run:
        name: Upload coverage to Codacy (partial)
        command: cd source; bash <(curl -Ls https://coverage.codacy.com/get.sh) report --partial -r coverage/lcov.info

# after
jasmine:
  executor: node-ci
  steps:
    - checkout
    - install-deps:
        path: source
    - run-tests:
        path: source
```

Apply the same transformation to each job in scope, substituting its own directory (`source`, `dev/frontend`, `frontend`, `clients/node`, `worker`) for `path`, and choosing `run-tests` for the `jasmine-*` jobs vs. `lint-and-report` for the `checks-*` jobs. `jasmine-dev` and `checks-dev` are explicitly out of scope here — they need the extra `setup-dev` step handled in step 4.

## Files to Change

- `.circleci/config.yml` — rewrite `jasmine`, `checks`, `jasmine-dev-frontend`, `checks-dev-frontend`, `checks-frontend`, `jasmine-frontend`, `jasmine-client`, `checks-client`, `jasmine-worker`, `checks-worker` to use `executor: node-ci` plus `install-deps`/`run-tests`/`lint-and-report`, per the example above.
