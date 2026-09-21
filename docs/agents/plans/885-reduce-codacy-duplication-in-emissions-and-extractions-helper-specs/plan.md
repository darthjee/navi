# Plan: Reduce Codacy duplication in frontend helper specs (loading, error and empty states)

Issue: [885-reduce-codacy-duplication-in-emissions-and-extractions-helper-specs.md](../../issues/885-reduce-codacy-duplication-in-emissions-and-extractions-helper-specs.md)

## Overview
Extract the repeated `.renderLoading` / `.renderError` / empty-state scenarios of the frontend helper specs into shared examples under `frontend/spec/support/`, and move the hand-rolled container setup to the existing `useContainer()` / `renderInAct()`. Test-only change owned entirely by the `frontend` agent.

See [frontend.md](frontend.md) for the full plan.
