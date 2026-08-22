# frontend Plan: Crawler: add ExtractionJob with a pluggable parser registry and the regex parser

Main plan: [plan.md](plan.md)

## Shared contracts

Depends on `engine` exporting the new backend job class under the exact name `ExtractionJob` (`source/lib/jobs/ExtractionJob.js`, registered as `JobFactory.build('Extraction', ...)`). No other frontend behavior depends on this issue.

## Implementation Steps

### Step 1 — Register the new job class

Per `docs/agents/contributing/code-organization.md` ("Adding a New Job Class"), add `'ExtractionJob'` to the `JOB_CLASSES` array so the job-class filter dropdown in the monitoring dashboard recognizes it.

## Files to Change

- `frontend/src/constants/jobClasses.js` — add `'ExtractionJob'` to `JOB_CLASSES`.
