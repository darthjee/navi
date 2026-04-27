# Plan: Improve View in the Frontend

## Overview

Make job detail (show) views status-aware. Each status will display only the fields relevant to it, and two sections (Arguments and Last Error) will be collapsible. The work spans the backend serializer, the React frontend, and the agent documentation.

## Parts

| File | Scope |
|------|-------|
| [plan_backend.md](plan_backend.md) | Extend `JobShowSerializer` with `lastError` and `backtrace`; update serializer tests. |
| [plan_frontend.md](plan_frontend.md) | Refactor `Job` component into status-aware rendering; add collapsible sections; update frontend tests. |
| [plan_docs.md](plan_docs.md) | Update `web-server.md` and `frontend.md` to reflect the new serializer output and component structure. |

## Notes

- Backend changes must be completed before frontend work begins, as the frontend depends on the new serializer fields.
- Open question: is `lastError` a plain string or a structured object on the Job model? Must be confirmed before implementing the serializer.
