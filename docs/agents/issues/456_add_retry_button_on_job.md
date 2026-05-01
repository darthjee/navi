# Issue: Add Retry Button on Job

## Description

The Job detail view currently has no way to manually retry a failed job from the UI. A new endpoint and a corresponding button need to be added so a user can send a specific job directly to the retry queue on demand.

## Problem

- There is no way to manually trigger a retry for a specific job from the web UI
- Operators must wait for the automatic retry cooldown or have no recourse for stuck/dead jobs

## Expected Behavior

- A new `PATCH /jobs/:id/retry` endpoint is added to the backend that moves the specified job directly to the retry queue
- A "Retry" button is added to the Job detail page in the frontend
- Clicking the button calls the endpoint and refreshes the job view

## Solution

### Backend (`source/`)

1. Add a new request handler (e.g. `JobRetryRequestHandler`) that handles `PATCH /jobs/:id/retry`
2. The handler looks up the job by ID via `JobRegistry.jobById(id)` and moves it to the retry queue
3. Register the route in `Router`

### Frontend (`frontend/`)

1. Add a `retryJob(id)` method to `JobClient`
2. Add a "Retry" button to the Job detail component, visible only when the job is in a retryable state (e.g. `failed` or `dead`)
3. On click, call `retryJob(id)` and refresh the job data

## Benefits

- Operators can unblock stuck or dead jobs without restarting the application
- Faster incident response when specific jobs need to be re-queued manually

---
See issue for details: https://github.com/darthjee/navi/issues/456
