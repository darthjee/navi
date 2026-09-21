# Plan: Reduce Codacy duplication in Job status and JobsView specs

Issue: [881-reduce-codacy-duplication-in-job-status-and-jobsview-specs.md](../../issues/881-reduce-codacy-duplication-in-job-status-and-jobsview-specs.md)

## Overview
Spec-only refactor inside `frontend/spec/`: share the duplicated `renderJob`/`flushAsync` helpers, turn the `Job_status_spec.js` scenario assertions into data, and de-duplicate (and rename) the `JobsController` spec currently named `JobsView_spec.js`.

See [frontend.md](frontend.md) for the full plan.
