# Plan: Reduce Codacy duplication in MemoryStatus specs

Issue: [878-reduce-codacy-duplication-in-memorystatus-specs.md](../../issues/878-reduce-codacy-duplication-in-memorystatus-specs.md)

## Overview
Spec-only refactor of `frontend/spec/components/MemoryStatus_spec.js` and `frontend/spec/components/MemoryStatusHelper_spec.js` to cut Codacy clones, reusing the shared helpers from issue #877 and adding two new ones under `frontend/spec/support/`.

See [frontend.md](frontend.md) for the full plan.
