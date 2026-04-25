# Issue: Add Jobs to Front-end

## Description

The Navi front-end needs new screens to display job information, consuming the JSON API routes exposed by the webserver.

## Problem

- There is no screen to list all jobs.
- There is no screen to inspect the details of a specific job.
- The front-end has no integration with the job-related JSON endpoints.

## Expected Behavior

- `/#/jobs` — displays a list of all jobs, fetching data from `GET /jobs.json`.
- `/#/job/:id` — displays details for a specific job, fetching data from `GET /job/:id.json`.

## Solution

- Add a `Jobs` screen at `/#/jobs` that requests `/jobs.json` and renders the job list.
- Add a `Job` detail screen at `/#/job/:id` that requests `/job/:id.json` and renders the job's information.
- Use React (already included in the project) for the component structure and Bootstrap (already included) for styling and layout.
- Configure the dev proxy to forward `*.json` requests to the Navi backend, since the JSON data originates there.

## Benefits

- Gives users visibility into the internal job queue directly from the front-end.
- Lays the foundation for richer queue observability in the UI.

---
See issue for details: https://github.com/darthjee/navi/issues/353
