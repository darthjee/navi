# Issue: Add View to Show the Logs

## Description

Add a frontend view at `/#/logs` that displays the application's log stream in real time, styled like a terminal window.

## Expected Behavior

- The route `/` redirects to `/#/logs`
- Logs are displayed in a dark/black terminal-style window
- Each log entry is coloured according to its level (e.g. info, warn, error)
- The newest log appears at the bottom of the list
- Logs are fetched continuously:
  - If the response array is empty, wait 1 second before fetching again
  - If the response array is not empty, append the new entries to the display and immediately issue a new request using the newest displayed log's ID as `last_id`

## Solution

- Add a `/#/logs` route to the React SPA
- Create a `LogsPage` component that:
  - Fetches `GET /logs.json` on mount
  - Continuously polls for new entries using `last_id` (id of the newest log already displayed)
  - Waits 1 second between polls when no new logs arrive
  - Appends new entries to the bottom of the list
- Style the log list as a dark terminal panel, with per-level colour coding
- Add a redirect from `/` to `/#/logs`

## Benefits

- Gives operators real-time visibility into application logs directly from the web UI
- Consistent with the existing monitoring dashboard

---
See issue for details: https://github.com/darthjee/navi/issues/426
