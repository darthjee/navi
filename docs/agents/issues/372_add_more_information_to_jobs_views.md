# Issue: Add More Information to Jobs Views

## Description

The jobs views (frontend list/show pages and backend API in `source/` via the web server) currently display only minimal information per job (id, status, and attempts). Both the index and show views need to be enriched with additional fields, requiring changes to the backend serializer and the frontend components.

## Problem

- The jobs index view shows too little information to be useful (only id, status, attempts).
- The jobs show view also lacks important details such as job class, arguments, remaining attempts, and retry readiness.
- The current serializer does not distinguish between index and show representations.

## Expected Behavior

### Index view additions
- Job class

### Show view additions
- Job class
- Arguments
- Remaining attempts
- Time until ready for retry (based on cooldown), displayed as a countdown
  - When empty (i.e. no cooldown pending), the job is marked as "ready"

## Solution

### Backend (`source/`)
- Split the existing job serializer into two: one for the index view and one for the show view.
- Further split serializers per job class, so each job class can provide its own serialization logic.
- Introduce a master serializer class that, when called, selects the appropriate serializer based on the job type and the requested view (index vs. show).
- Update the web server API endpoints to use the new serializer structure.

### Frontend (`frontend/`)
- Update the jobs index component to display the job class field.
- Update the job show component to display job class, arguments, remaining attempts, and the retry countdown (with "ready" indicator when no cooldown is pending).

## Benefits

- Gives operators full visibility into each job's state and retry behavior directly from the UI.
- Makes debugging failed or cooling-down jobs significantly easier.

---
See issue for details: https://github.com/darthjee/navi/issues/372
