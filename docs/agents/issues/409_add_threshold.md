# Issue: Add Threshold

## Description

When Navi runs on CI, dead jobs currently do not cause a failure exit — the process exits
with success even if some jobs never completed. The Engine needs to evaluate the ratio of
dead jobs to total jobs at exit time and return a failure exit code when that ratio exceeds
a configurable threshold.

## Problem

- Dead jobs are silently ignored at exit time.
- CI pipelines using Navi cannot detect that some URLs failed to warm, leading to false
  positives.

## Expected Behavior

- At exit, the Engine calculates: `dead_jobs / total_jobs * 100`.
- If the result exceeds the configured threshold percentage, Navi exits with a failure code.
- The threshold is configurable in the YAML config file under a new top-level `failure:` key:

```yaml
workers:
  quantity: 5
failure:
  threshold: 10.0  # 10% — exit with failure if more than 10% of jobs are dead
```

- If the `failure:` key is absent, the current behaviour is preserved (no failure on dead jobs).

## Solution

- Add a new `FailureConfig` model parsed from the `failure:` YAML key, holding the
  `threshold` value (float, percentage).
- Update `Config` to parse and expose the new `FailureConfig`.
- Update `Engine` (or `Application`) to check the dead-job ratio against the threshold after
  the run completes and exit with a non-zero code if exceeded.
- Update documentation:
  - `docs/agents/` (architecture / flow / overview as applicable)
  - `README.md`
  - `source/README.md`
  - `DOCKERHUB_DESCRIPTION.md`
  - `docs/HOW_TO_USE_NAVI.md`

## Benefits

- CI pipelines get reliable failure signals when Navi encounters dead jobs above the
  acceptable threshold.
- The threshold is configurable, so teams can tune tolerance to their needs.
- Absence of the key keeps backwards compatibility.

---
See issue for details: https://github.com/darthjee/navi/issues/409
