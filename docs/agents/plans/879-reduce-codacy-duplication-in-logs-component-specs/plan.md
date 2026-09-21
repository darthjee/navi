# Plan: Reduce Codacy duplication in Logs component specs

Issue: [879-reduce-codacy-duplication-in-logs-component-specs.md](../../issues/879-reduce-codacy-duplication-in-logs-component-specs.md)

## Overview
Spec-only refactor of the four Logs specs under `frontend/spec/components/`: extract shared fixtures and shared-example scenarios into a new `frontend/spec/support/logs.js`, and reuse the existing `support/` helpers instead of local copies. No production code changes.

See [frontend.md](frontend.md) for the full plan.
