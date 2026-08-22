# Plan: Frontend: memory status dashboard view

Issue: [685-frontend-memory-status-dashboard-view.md](../../issues/685-frontend-memory-status-dashboard-view.md)

## Overview

Add a new `/#/memory/status` page to the dashboard SPA that polls `GET /memory/status.json` every 5 seconds and renders current/maximum memory usage (converted to human-readable units) behind a 5-band color-coded status indicator. All work is frontend-only.

See [frontend.md](frontend.md) for the full plan.
