# Plan: CI Configuration

## New jobs

### `jasmine-dev-frontend`

Runs the Jasmine test suite with c8 coverage and uploads the report to Codacy. Follows the exact same structure as `jasmine-dev`:

```yaml
jasmine-dev-frontend:
  docker:
    - image: darthjee/circleci_node:0.2.1
  steps:
    - checkout
    - run:
        name: Install dependencies
        command: cd dev/frontend; yarn install
    - run:
        name: Unit tests (Jasmine + c8 coverage)
        command: cd dev/frontend; npm run coverage
    - run:
        name: Upload coverage to Codacy (partial)
        command: cd dev/frontend; bash <(curl -Ls https://coverage.codacy.com/get.sh) report --partial -r coverage/lcov.info
```

### `checks-dev-frontend`

Runs lint and duplication checks. Follows the exact same structure as `checks-dev`:

```yaml
checks-dev-frontend:
  docker:
    - image: darthjee/circleci_node:0.2.1
  steps:
    - checkout
    - run:
        name: Install dependencies
        command: cd dev/frontend; yarn install
    - run:
        name: Lint
        command: cd dev/frontend; npm run lint
    - run:
        name: Duplication report (JSCPD)
        command: cd dev/frontend; npm run report
```

## Workflow updates

### Add new jobs to the `test-and-release` workflow

```yaml
- jasmine-dev-frontend:
    filters:
      tags:
        only: /.*/
- checks-dev-frontend:
    filters:
      tags:
        only: /.*/
```

### Update `coverage-final` — add `jasmine-dev-frontend` to `requires`

```yaml
- coverage-final:
    requires: [jasmine, jasmine-dev, jasmine-dev-frontend, jasmine-frontend]
```

### Update `npm-publish` — add both new jobs to `requires`

```yaml
- npm-publish:
    requires: [
      check-version-tag,
      jasmine, jasmine-dev, jasmine-dev-frontend, jasmine-frontend,
      checks, checks-dev, checks-dev-frontend, checks-frontend
    ]
```

## Notes

- Coverage is reported with `--partial` so Codacy waits for all partial reports before computing the final score. The `coverage-final` job sends the finalization signal.
- The `coverage` script in `package.json` must use `--reporter=lcov` to produce `coverage/lcov.info` (already defined in the `package.json` plan).
