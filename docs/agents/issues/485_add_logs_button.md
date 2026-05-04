# Issue: Add Logs Button

## Description

The monitoring dashboard currently displays buttons showing statistics for workers and jobs. A new "Logs" button needs to be added alongside these existing buttons, matching their visual style, and navigating to the `/#/jobs` page when clicked.

## Problem

- There is no direct navigation button to the jobs/logs page on the dashboard
- Users must navigate manually to `/#/jobs` instead of having a quick-access button consistent with the existing UI

## Expected Behavior

- A "Logs" button appears next to the existing workers and jobs statistics buttons
- The button matches the style of the existing statistics buttons
- Clicking the button navigates to `/#/jobs`

## Solution

- Add a new button component in the dashboard, adjacent to the existing worker and job stat buttons
- Apply the same styling as the current buttons
- Wire up the button's `onClick` (or use a link) to navigate to `/#/jobs`

## Benefits

- Improves discoverability of the jobs/logs page
- Provides a consistent, one-click navigation experience matching the existing dashboard UI

---
See issue for details: https://github.com/darthjee/navi/issues/485
