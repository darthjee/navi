# Issue: Print Summary at Application End

## Description

When the application is closing (see `source/lib/services/ApplicationInstance.js#L81`), it checks for failures but does not print a summary of the run results to the user.

## Problem

- The application checks failure counts at shutdown but produces no visible output summarizing the run.
- Users have no way to know at a glance whether the run succeeded or failed, how many jobs were processed, or what the failure rate was.

## Expected Behavior

- Before checking the failure threshold, the application should print a summary to the console, including:
  - Total number of jobs
  - Number of failures (failed + retry + dead)
  - Failure percentage
  - Pass/fail result based on the configured threshold

Example output:

```
Total: 10
Failed: 4 (40%)
Threshold: 30%
Result: Failure
```

## Solution

- In `ApplicationInstance.js`, before the failure check at line 81, add a call to print a summary report.
- The summary should aggregate counts from the engine/queue state: total jobs, failed jobs (including retried and dead-letter), and compute the percentage.
- Compare the percentage against the configured threshold and print the result (`Success` or `Failure`).

## Benefits

- Gives operators immediate feedback on run outcomes without having to parse logs.
- Makes CI/CD integration easier by surfacing the result clearly at process exit.

---
See issue for details: https://github.com/darthjee/navi/issues/583
