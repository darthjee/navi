# Plan: Coverage Report for Multiple Sources (#90)

Issue: https://github.com/darthjee/navi/issues/90

## Context

The project has two independent Node.js apps with separate CircleCI jobs:

| Job | Directory | Current coverage upload |
|-----|-----------|------------------------|
| `jasmine` | `source/` | uploads without `--partial` (overwrites) |
| `jasmine-dev` | `new-dev/` | upload is disabled (echoed, not executed) |

Both jobs run in parallel. The fix uses Codacy's partial-upload flow:
each job uploads its report with `--partial`, and a new third job (`coverage-final`)
depends on both and sends the final signal.

Reference: https://docs.codacy.com/coverage-reporter/uploading-coverage-in-advanced-scenarios/#multiple-reports-once

## Only file to change: `.circleci/config.yml`

### Step 1 — Update the `jasmine` job

Add `--partial` to the Codacy upload step:

```yaml
# before
- run:
    name: Upload coverage to Codacy
    command: cd source; bash <(curl -Ls https://coverage.codacy.com/get.sh) report -r coverage/lcov.info

# after
- run:
    name: Upload coverage to Codacy (partial)
    command: cd source; bash <(curl -Ls https://coverage.codacy.com/get.sh) report --partial -r coverage/lcov.info
```

### Step 2 — Update the `jasmine-dev` job

Replace the echoed (disabled) upload with a real `--partial` upload:

```yaml
# before
- run:
    name: Upload coverage to Codacy (Disable for now)
    command: cd new-dev; echo 'bash <(curl -Ls https://coverage.codacy.com/get.sh) report -r coverage/lcov.info'

# after
- run:
    name: Upload coverage to Codacy (partial)
    command: cd new-dev; bash <(curl -Ls https://coverage.codacy.com/get.sh) report --partial -r coverage/lcov.info
```

### Step 3 — Add `coverage-final` job

Add a new lightweight job that sends the final signal to Codacy after both
partial uploads are done:

```yaml
coverage-final:
  docker:
    - image: darthjee/circleci_node:0.2.1
  steps:
    - run:
        name: Finalize coverage on Codacy
        command: bash <(curl -Ls https://coverage.codacy.com/get.sh) final
```

### Step 4 — Add `coverage-final` to the workflow

```yaml
workflows:
  test-and-release:
    jobs:
      - jasmine:
          filters:
            tags:
              only: /.*/
      - checks:
          filters:
            tags:
              only: /.*/
      - jasmine-dev:
          filters:
            tags:
              only: /.*/
      - checks-dev:
          filters:
            tags:
              only: /.*/
      - coverage-final:
          requires: [jasmine, jasmine-dev]
          filters:
            tags:
              only: /.*/
```

## Final state of `.circleci/config.yml`

```yaml
version: 2.1

workflows:
  test-and-release:
    jobs:
      - jasmine:
          filters:
            tags:
              only: /.*/
      - checks:
          filters:
            tags:
              only: /.*/
      - jasmine-dev:
          filters:
            tags:
              only: /.*/
      - checks-dev:
          filters:
            tags:
              only: /.*/
      - coverage-final:
          requires: [jasmine, jasmine-dev]
          filters:
            tags:
              only: /.*/

jobs:
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

  checks:
    docker:
      - image: darthjee/circleci_node:0.2.1
    steps:
      - checkout
      - run:
          name: Install dependencies
          command: cd source; yarn install
      - run:
          name: Lint
          command: cd source; npm run lint
      - run:
          name: Duplication report (JSCPD)
          command: cd source; npm run report

  jasmine-dev:
    docker:
      - image: darthjee/circleci_node:0.2.1
    steps:
      - checkout
      - run:
          name: Install dependencies
          command: cd new-dev; yarn install
      - run:
          name: Unit tests (Jasmine + c8 coverage)
          command: cd new-dev; npm run coverage
      - run:
          name: Upload coverage to Codacy (partial)
          command: cd new-dev; bash <(curl -Ls https://coverage.codacy.com/get.sh) report --partial -r coverage/lcov.info

  checks-dev:
    docker:
      - image: darthjee/circleci_node:0.2.1
    steps:
      - checkout
      - run:
          name: Install dependencies
          command: cd new-dev; yarn install
      - run:
          name: Lint
          command: cd new-dev; npm run lint
      - run:
          name: Duplication report (JSCPD)
          command: cd new-dev; npm run report

  coverage-final:
    docker:
      - image: darthjee/circleci_node:0.2.1
    steps:
      - run:
          name: Finalize coverage on Codacy
          command: bash <(curl -Ls https://coverage.codacy.com/get.sh) final
```

## Acceptance Criteria

- [ ] `jasmine` job uploads `source/coverage/lcov.info` with `--partial`
- [ ] `jasmine-dev` job uploads `new-dev/coverage/lcov.info` with `--partial`
- [ ] `coverage-final` job runs after both and sends the final signal to Codacy
- [ ] Codacy dashboard shows combined coverage from both applications for the same commit
