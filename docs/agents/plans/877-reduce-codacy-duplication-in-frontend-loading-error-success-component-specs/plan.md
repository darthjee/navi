# Plan: Reduce Codacy duplication in frontend loading/error/success component specs

Issue: [877-reduce-codacy-duplication-in-frontend-loading-error-success-component-specs.md](../../issues/877-reduce-codacy-duplication-in-frontend-loading-error-success-component-specs.md)

## Overview
Introduce shared spec helpers under `frontend/spec/support/` (`flushAsync`, `mockFetchPending` and a shared "fetch states" example) and adopt them in the five target specs: Emissions, Extractions, Job, Jobs and StatsHeader. Only the `frontend/` folder is touched.

See [frontend.md](frontend.md) for the full plan.
