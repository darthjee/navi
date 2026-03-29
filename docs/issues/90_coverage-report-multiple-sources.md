# Coverage Report for Multiple Sources (#90)

Issue Link: https://github.com/darthjee/navi/issues/90

## Problem

The project has two independent Node.js applications, each with their own test suite and coverage configuration:

- **`source/`** — the main Navi cache-warmer app, tested with `c8` + Jasmine, coverage includes `lib/**/*.js`
- **`new-dev/`** — the Express-based dev server, tested with `c8` + Jasmine, coverage includes `app.js`

Currently, only a single coverage report is uploaded to Codacy. The second application's coverage is either missing or overwriting the first, meaning Codacy does not have a complete picture of the project's test coverage.

## Solution

Codacy supports uploading coverage from multiple reports in a single commit using the `--partial` flag on each upload and a final `--final` call to signal completion. Reference: https://docs.codacy.com/coverage-reporter/uploading-coverage-in-advanced-scenarios/#multiple-reports-once

### Upload sequence

```bash
# 1. Run coverage for source/
cd source && yarn coverage          # generates source/coverage/lcov.info

# 2. Run coverage for new-dev/
cd new-dev && yarn coverage         # generates new-dev/coverage/lcov.info

# 3. Upload source/ coverage as partial
bash <(curl -Ls https://coverage.codacy.com/get.sh) report \
  --partial \
  -l JavaScript \
  -r source/coverage/lcov.info

# 4. Upload new-dev/ coverage as partial
bash <(curl -Ls https://coverage.codacy.com/get.sh) report \
  --partial \
  -l JavaScript \
  -r new-dev/coverage/lcov.info

# 5. Mark upload as complete
bash <(curl -Ls https://coverage.codacy.com/get.sh) final
```

### Required changes

1. **CI pipeline** — update the coverage upload step(s) to run both `source/` and `new-dev/` coverage generation and upload them as partial reports before sending the final signal.
2. **`source/package.json`** — the `coverage` script already generates `lcov` output (`npx c8 --reporter=lcov jasmine spec/**/*.js`). No change needed.
3. **`new-dev/package.json`** — the `coverage` script already generates `lcov` output (`npx c8 --reporter=lcov jasmine spec/**/*.js`). No change needed.

## Acceptance Criteria

- [ ] CI runs `yarn coverage` inside both `source/` and `new-dev/` containers
- [ ] Both `source/coverage/lcov.info` and `new-dev/coverage/lcov.info` are uploaded to Codacy using `--partial`
- [ ] The final `codacy-coverage-reporter final` call is made after both partial uploads
- [ ] Codacy dashboard shows coverage data from both applications for the same commit
