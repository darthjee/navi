# Add executors and commands to config.yml

Add a top-level `executors:` and `commands:` block to `.circleci/config.yml`, without touching any existing job yet — this step only introduces the reusable building blocks that step 3 and step 4 will wire jobs up to.

## Executors

```yaml
executors:
  node-ci:
    docker:
      - image: darthjee/circleci_node:0.2.1
  scripts-ci:
    docker:
      - image: darthjee/scripts:0.6.0
```

## Commands

```yaml
commands:
  install-deps:
    parameters:
      path:
        type: string
      frozen:
        type: boolean
        default: false
    steps:
      - run:
          name: Install dependencies
          command: |
            cd <<parameters.path>>
            if [ "<<parameters.frozen>>" = "true" ]; then
              yarn install --frozen-lockfile
            else
              yarn install
            fi

  run-tests:
    parameters:
      path:
        type: string
    steps:
      - run:
          name: Unit tests (Jasmine)
          command: cd <<parameters.path>>; npm run coverage
      - run:
          name: Upload coverage to Codacy (partial)
          command: scripts/ci.sh coverage <<parameters.path>>

  lint-and-report:
    parameters:
      path:
        type: string
    steps:
      - run:
          name: Lint
          command: cd <<parameters.path>>; npm run lint
      - run:
          name: Duplication report (JSCPD)
          command: cd <<parameters.path>>; npm run report
```

`install-deps`'s `frozen` parameter covers the `--frozen-lockfile` variant used by the publish jobs in step 4, so both install flavors go through one command.

## Files to Change

- `.circleci/config.yml` — add the `executors:` and `commands:` top-level blocks shown above, right after the `workflows:` block and before `jobs:`. No existing job references them yet (done in steps 3–4).
