# Plan: Fix memory endpoint

Issue: [696-fix-memory-endpoint.md](../issues/696-fix-memory-endpoint.md)

## Overview

The memory status page renders the backend's raw floating-point `percentage`
with no rounding (e.g. `16.326141357421875%`). Add a `formatPercentage`
utility, mirroring the existing `formatBytes` pattern, and use it in
`MemoryStatusHelper` to truncate the percentage to one decimal place with
round-half-up rounding. Separately, bring `docs/agents/frontend.md` up to
date with the memory status page (route, component, client), which was
added recently but never documented.

## Agents involved

- [frontend](frontend.md)
- [architect](architect.md)

## Shared contracts

None that block either side — the two pieces of work are independent and
can proceed in parallel:

- `frontend` creates `frontend/src/utils/formatPercentage.js` and wires it
  into `frontend/src/components/pages/helpers/MemoryStatusHelper.jsx`.
- `architect` documents the already-existing (pre-issue) `MemoryStatus`
  page — route, component, controller, helper, client — in
  `docs/agents/frontend.md`. This documentation update does not depend on
  `formatPercentage.js` landing first; the page and its files already
  exist on disk.
