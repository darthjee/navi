# Plan: Reduce deep nesting in ResourceRequestJob_spec.js #perform block

## Overview

Refactor the `#perform` describe block in `ResourceRequestJob_spec.js` to eliminate
unnecessary nesting and consolidate duplicated spy setup across sibling `beforeEach`
blocks. The goal is no more than 3 levels of nesting in any describe block.

## Context

The `#perform` block reaches 4 levels of nesting and duplicates spy setup for
`axios.get`, `Logger.info`, and `resourceRequest.enqueueActions` in every sibling
`beforeEach`. When the logging infrastructure was refactored (#260), `LoggerUtils`
was introduced, but the structural duplication of `spyOn(resourceRequest, 'enqueueActions')`
and the HTTP stub remains.

## Implementation Steps

### Step 1 — Read the current spec structure

Inspect `ResourceRequestJob_spec.js` to map the exact nesting levels and identify which
spies/variables are truly specific to each branch vs. shared across all cases.

### Step 2 — Move shared spy setup to the #perform beforeEach

`spyOn(resourceRequest, 'enqueueActions').and.stub()` is set up in every nested
`beforeEach`. Move it to the top-level `beforeEach` of `describe('#perform')` so it
only appears once.

### Step 3 — Flatten single-it describe blocks

Any `describe` that contains only one `it` and no setup of its own can be lifted
one level up, replacing the `describe` wrapper with a descriptive `it` string.

### Step 4 — Parameterise the HTTP stub at the #perform level

The two main branches (successful / failing request) differ only in HTTP status.
Introduce a shared `beforeEach` at the `#perform` level that calls
`AxiosUtils.stubGet(status)`, where `status` is set by a nested `beforeEach` per
branch. This removes the duplicated `spyOn(axios, 'get')` / `AxiosUtils.stubGet`
calls.

### Step 5 — Verify nesting depth

Confirm no describe block exceeds 3 levels:
`describe('ResourceRequestJob') → describe('#perform') → describe('when ...')`.

## Files to Change

- `source/spec/lib/models/ResourceRequestJob_spec.js` — structural refactor only;
  no production code changes.

## Notes

- The observable behaviour of the test suite must remain identical after the refactor.
- `LoggerUtils.stubLoggerMethods()` is already called at the top-level `beforeEach`
  (from issue #260), so Logger spies do not need to be re-extracted.
- Do not change the assertions or test intent — only restructure the setup.
