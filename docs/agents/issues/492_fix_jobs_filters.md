# Issue: Fix Jobs Filters

## Description

The job class filters in the queues view are not functioning correctly — they do not actually filter the jobs displayed, causing all jobs for a given queue to be returned regardless of the selected filter.

## Problem

- Job class filter controls exist in the queues view but have no filtering effect.
- All jobs for a particular queue are returned even when a filter is applied.
- Users cannot narrow down job listings by class as expected.

## Expected Behavior

- Selecting a job class filter should restrict the displayed jobs to only those matching the selected class.
- The queue view should reflect the filtered result set accurately.

## Solution

- Identify where the job class filter is applied (likely in the API handler or query logic for the queues view).
- Ensure the filter parameter is correctly read and passed to the job retrieval logic.
- Apply the filter condition so that only jobs matching the specified class are returned.

## Benefits

- Users can efficiently find and inspect jobs of a specific class within a queue.
- Reduces noise in the queues view, improving usability of the monitoring dashboard.

---
See issue for details: https://github.com/darthjee/navi/issues/492
