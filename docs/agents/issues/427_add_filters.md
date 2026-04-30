# Issue: Add Filters

## Description
Add filtering capabilities to the jobs view, allowing users to narrow down the job list by one or more job classes via a multi-select dropdown.

## Problem
- The jobs view currently shows all jobs with no way to filter them
- Users cannot narrow results by job class

## Expected Behavior
- A multi-select dropdown is available in the jobs view to filter by job class
- Selecting one or more classes sends `?filters[class][]=<class>&filters[class][]=<other_class>...` as query parameters
- The API filters the returned jobs based on the provided class filters

## Solution
- Add a multi-select dropdown component to the jobs view UI
- Update the jobs API request to append `filters[class][]` query parameters for each selected class
- Introduce a filter class on the backend that receives the job collection and the filter parameters and applies them
- Wire the filter class into the jobs API endpoint so filtered results are returned

## Benefits
- Improves usability for deployments with many job classes
- Allows operators to quickly inspect jobs of a specific type

---
See issue for details: https://github.com/darthjee/navi/issues/427
