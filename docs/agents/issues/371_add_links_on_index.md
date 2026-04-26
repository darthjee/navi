# Issue: Add Links on Index

## Description

The application frontend (`frontend/`) index page lists job queue summaries, but the summary items are not clickable. Each summary should link to the corresponding jobs list page at `/#/jobs/<queue>`.

## Problem

- The index page displays job summaries per queue but provides no navigation to the detail view.
- Users cannot click through from the summary to see the actual jobs in a given queue.

## Expected Behavior

- Each queue summary on the index page includes a link to `/#/jobs/<queue>`.
- Clicking the link navigates the user to the jobs list filtered by that queue.

## Solution

- Add anchor links (or React Router `<Link>` components) to each summary item on the index page, pointing to `/#/jobs/<queue>`.

## Benefits

- Improves navigation and usability of the web UI.
- Allows users to drill down from the summary view directly into the job list for a specific queue.

---
See issue for details: https://github.com/darthjee/navi/issues/371
