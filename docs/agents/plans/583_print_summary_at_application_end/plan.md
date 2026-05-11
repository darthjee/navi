# Plan: Print Summary at Application End

## Overview

Add a run summary that is printed to the console when the application is closing, before the failure threshold check. The summary shows total jobs, failure counts, failure percentage, configured threshold, and the final pass/fail result.

## Context

`ApplicationInstance.js` (line ~81) already checks failure counts against a configured threshold at shutdown, but produces no visible output. Operators currently have no way to see the overall result at a glance. The fix adds a summary print step immediately before that check.

The `console` policy in this project only allows `console.warn` and `console.error` — so the summary must be printed via the project's logging infrastructure (`LogRegistry` / `ConsoleLogger`), not via `console.log`.

## Implementation Steps

### Step 1 — Create a `RunSummary` model (or service)

Create a new class (e.g., `source/lib/services/RunSummary.js`) responsible for:
- Receiving job counts (total, failed, retry, dead) and the configured threshold.
- Computing the failure percentage.
- Determining the result label (`Success` or `Failure`).
- Exposing a method to format the summary as a string (or structured log lines).

Keeping this logic in its own class makes it independently testable.

### Step 2 — Collect job counts in `ApplicationInstance`

Before the existing failure check in `ApplicationInstance.js`, gather the required counts from `JobRegistry`:
- Total jobs (all queues combined, or finished + failed + dead).
- Failed jobs (failed + retry + dead queues).

### Step 3 — Print the summary

Instantiate `RunSummary` with the counts and threshold, then log the formatted output via the project's logging infrastructure (e.g., `LogRegistry`) immediately before the failure threshold check.

Example output:
```
Total: 10
Failed: 4 (40%)
Threshold: 30%
Result: Failure
```

### Step 4 — Write tests

- Unit-test `RunSummary` for correct percentage calculation, result label selection, and formatted output.
- Update or add tests for `ApplicationInstance` to assert the summary is logged before the threshold check.

## Files to Change

- `source/lib/services/RunSummary.js` — new class encapsulating summary logic and formatting.
- `source/lib/services/ApplicationInstance.js` — call `RunSummary` and log the output before the failure check (~line 81).
- `source/spec/lib/services/RunSummary_spec.js` — new spec file.
- `source/spec/lib/services/ApplicationInstance_spec.js` — update to assert summary logging.

## Notes

- Only `console.warn` and `console.error` are permitted by ESLint; the summary must go through the project's logging layer.
- The exact queues that count as "failed" (failed vs. retry vs. dead) need to be confirmed against `JobRegistry`'s queue structure.
- The threshold format (percentage as a decimal or integer) needs to match what `FailureConfig` already stores.
