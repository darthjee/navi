# Extract lint-and-report command

The `lint-and-report` CircleCI command currently runs two separate inline steps:

```yaml
steps:
  - run:
      name: Lint
      command: cd <<parameters.path>>; npm run lint
  - run:
      name: Duplication report (JSCPD)
      command: cd <<parameters.path>>; npm run report
```

Move the shell into `scripts/ci/lint-and-report.sh`, taking the target path as `$1`:

```bash
#!/bin/bash
set -e

DIR=$1

cd "$DIR"
npm run lint
npm run report
```

Add the `lint-and-report` case to `scripts/ci.sh`:

```bash
lint-and-report) bash "$DIR/ci/lint-and-report.sh" "$@" ;;
```

Collapse the two `run:` steps inside the `lint-and-report` command in `.circleci/config.yml` into a single step calling the script — one action, one script, matching the pattern used everywhere else in this issue:

```yaml
steps:
  - run:
      name: Lint and report
      command: scripts/ci.sh lint-and-report <<parameters.path>>
```

## Files to Change

- `scripts/ci/lint-and-report.sh` — new script, `set -e`, positional `$1` (path), runs `npm run lint` then `npm run report`
- `scripts/ci.sh` — add `lint-and-report` case
- `.circleci/config.yml` — `lint-and-report` command's two `run:` steps collapse into one `- run: { name: Lint and report, command: scripts/ci.sh lint-and-report <<parameters.path>> }`
