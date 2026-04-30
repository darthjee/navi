# Plan: Refactor Components in Frontend

## Overview

Split each mixed-concern component in `frontend/src/components/` into the three-file pattern:

- `<Name>.jsx` — component (state, effects, orchestration only)
- `<Name>Helper.jsx` — HTML rendering helpers
- `<Name>View.jsx` — data manipulation logic (fetch, handlers, derived state)

The `Jobs` component is already complete and serves as the reference implementation.

## Components

Each component has its own plan file:

| Component | Plan file |
|---|---|
| `Job` | [plan_job.md](plan_job.md) |
| `BaseUrlsMenu` | [plan_base_urls_menu.md](plan_base_urls_menu.md) |
| `EngineControls` | [plan_engine_controls.md](plan_engine_controls.md) |
| `LogsPage` | [plan_logs_page.md](plan_logs_page.md) |
| `StatsHeader` | [plan_stats_header.md](plan_stats_header.md) |
| `JobDetails` | [plan_job_details.md](plan_job_details.md) |
| `ReadyCountdown` | [plan_ready_countdown.md](plan_ready_countdown.md) |
| Documentation | [plan_docs.md](plan_docs.md) |

## Implementation Order

Tackle each component as an independent, self-contained commit. Suggested order (simplest first):

1. `ReadyCountdown` — extract a single class
2. `JobDetails` — extract HTML rendering only
3. `Job` — split existing Helper
4. `BaseUrlsMenu` — split existing Helper
5. `EngineControls` — split existing Helper
6. `LogsPage` — split existing Helper
7. `StatsHeader` — create both Helper and View from scratch
8. Documentation — update `docs/agents/frontend.md` with component conventions

## Notes

- Each component refactor should be a single atomic commit (tests + implementation together).
- The component file (`<Name>.jsx`) must remain thin: only `useState`, `useEffect`, `useMemo`, `useRef`, and delegation to Helper/View.
- No behavior changes — this is a pure structural refactor.
