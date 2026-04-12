# Plan: Pass Parameters from Resource Request to Action

## Overview

Enable action parameter mappings to reference the originating request's parameters via a
`parameters.<key>` path expression, in addition to the already-supported `parsed_body.<key>`
and `headers[...]` expressions.

## Context

When a `ResourceRequestJob` completes, it calls `resourceRequest.enqueueActions(wrapper)`,
where `wrapper` is a `ResponseWrapper` built from the HTTP response. Each `ResourceRequestAction`
then uses `ParametersMapper` to evaluate path expressions against that wrapper to produce the
parameters for the next job.

Currently `ResponseWrapper` only exposes the response data (`parsed_body`, `headers`). The job's
own parameters — the values used to resolve the URL placeholders — are not forwarded, so downstream
actions cannot carry parent identifiers through the chain.

## Implementation Steps

### Step 1 — Extend `ResponseWrapper` to carry request parameters

Add an optional `parameters` property to `ResponseWrapper`. When the wrapper is created from a
job's response, the job's own parameters are stored on the wrapper. The `toItemWrappers()` method
must propagate `parameters` to each per-item wrapper it creates.

### Step 2 — Update `ResourceRequestJob` to pass parameters into the wrapper

When `ResourceRequestJob` builds the `ResponseWrapper` after a successful HTTP request, pass the
job's `parameters` into the wrapper constructor (or via a setter) so they are available downstream.

### Step 3 — Expose `parameters` in `ParametersMapper` / `PathResolver`

`ParametersMapper` evaluates each path expression against the wrapper. Introduce a `parameters`
top-level namespace so that an expression like `parameters.id` resolves against the wrapper's
stored `parameters` object. No change should be needed to `PathResolver` or `PathSegmentTraverser`
if `ParametersMapper` simply adds `parameters` as a named key on the object it passes to the
resolver.

### Step 4 — Add / update specs

- `ResponseWrapper_spec.js` — verify that `parameters` is stored and forwarded by `toItemWrappers()`.
- `ResourceRequestJob_spec.js` — verify that the wrapper passed to `enqueueActions` carries the
  job's parameters.
- `ParametersMapper_spec.js` — verify that a `parameters.<key>` expression resolves correctly.
- Integration / chaining spec (if one exists) — add a scenario covering multi-level chaining with
  `parameters.<key>` propagation.

## Files to Change

- `source/lib/models/ResponseWrapper.js` — add `parameters` property; propagate it in `toItemWrappers()`.
- `source/lib/models/ResourceRequestJob.js` — pass job parameters when constructing `ResponseWrapper`.
- `source/lib/models/ParametersMapper.js` — expose `parameters` namespace when building the object for path resolution.
- `source/spec/lib/models/ResponseWrapper_spec.js` — new/updated specs.
- `source/spec/lib/models/ResourceRequestJob_spec.js` — new/updated specs.
- `source/spec/lib/models/ParametersMapper_spec.js` — new/updated specs.

## Notes

- `ResponseWrapper.toItemWrappers()` splits an array response into per-item wrappers. Each split
  wrapper must receive the same `parameters` reference so that all triggered actions share the
  same parent context.
- The `MissingMappingVariable` exception should still be thrown when a `parameters.<key>` path
  cannot be resolved (same behaviour as for `parsed_body`).
- No YAML config changes are required — the `parameters.<key>` syntax is already valid path
  expression syntax; it just needs to resolve against the new namespace.
