# Plan: Add Links on Index

## Overview

Add navigation links to the index page of the application frontend (`frontend/`) so that each job queue summary links to `/#/jobs/<queue>`, allowing users to drill down into the jobs list for a specific queue.

## Context

The index page currently shows summaries of job queues but provides no way to navigate to the detail view. Users must manually type the URL or use another means to see jobs by queue. Adding links improves usability and makes the UI consistent with the existing `/#/jobs/:status` routing.

## Implementation Steps

### Step 1 — Locate the index page component

Find the component responsible for rendering job queue summaries on the index page inside `frontend/src/`.

### Step 2 — Add links to each summary item

Wrap or replace each queue summary item with a React Router `<Link>` (or `<a>`) pointing to `/#/jobs/<queue>`, where `<queue>` is the queue name/status for that summary.

## Files to Change

- `frontend/src/` — the index page component that renders the summary list (exact file to be confirmed by inspecting the codebase)

## Notes

- The app uses hash-based routing (`/#/...`), so links must use the hash format or React Router's `<Link to="/jobs/<queue>">` with a `HashRouter`.
- No backend changes are required — this is a pure frontend UI change.
