# Plan: Reduce Codacy duplication in frontend controller specs

Issue: [884-reduce-codacy-duplication-in-frontend-controller-specs.md](../../issues/884-reduce-codacy-duplication-in-frontend-controller-specs.md)

## Overview
Remove the copy-pasted scaffolding from the four frontend controller specs (Emissions, MemoryChart, Logs, Extractions) by moving it into `frontend/spec/support/`, without touching production code or dropping any assertion.

See [frontend.md](frontend.md) for the full plan.
