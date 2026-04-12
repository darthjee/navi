# Plan: Drop variables_map Usage for a More Powerful Engine

## Overview

Replace the limited `variables_map` config field with a new `parameters` field that gives full access to the HTTP response — both the parsed JSON body and the response headers. This requires introducing a response wrapper object and updating the mapping logic, config parsing, and all related documentation.

## Context

Currently, `ResourceRequestAction` uses a `variables_map` to rename fields from the response item before passing them as parameters to the next job. The mapping class (`VariablesMapper`) only receives a flat item object, so it cannot access headers or nested body structure. The new approach:

- Renames the config key from `variables_map` to `parameters`.
- Passes the full HTTP response (or a wrapper) to the mapper instead of a pre-parsed item.
- Exposes `parsed_body` (deserialised JSON) and `headers` on the wrapper.
- Allows YAML expressions like `parsed_body.id` or `headers['page']` as mapping values.

## Implementation Steps

### Step 1 — Introduce a `ResponseWrapper` model

Create a new model class (e.g., `ResponseWrapper`) that wraps the raw HTTP response object returned by `Client`. It must expose:
- `parsed_body` — lazy-parsed JSON of the response body (reuse or delegate to `ResponseParser`).
- `headers` — the raw headers map from the HTTP response.

This wrapper becomes the object the mapping layer operates on.

### Step 2 — Update `VariablesMapper` to evaluate path expressions

Refactor `VariablesMapper` so that, instead of doing a simple key rename on a flat object, it evaluates dot-notation / bracket-notation path expressions (e.g., `parsed_body.id`, `headers['page']`) against the `ResponseWrapper`. Each value in the `parameters` map is a path string resolved against the wrapper.

Update or replace the `MissingMappingVariable` exception as needed to reflect the new path-based lookup.

### Step 3 — Update `ResourceRequest` / `ResourceRequestAction` to pass the response wrapper

Update the call chain so that when actions are enqueued after a successful HTTP request, the full `ResponseWrapper` (not just the raw body string) is passed through to `ResourceRequestAction` and then to `VariablesMapper`.

This may involve changing the signature of `enqueueActions` on `ResourceRequest` to accept the response wrapper, and updating `ResourceRequestAction.execute` accordingly.

### Step 4 — Update `Client` to return a response wrapper

Update `Client.perform` to return (or make available) a `ResponseWrapper` instead of — or in addition to — the raw body string, so the wrapper can be forwarded through the action pipeline.

### Step 5 — Update `ConfigParser` to read `parameters` instead of `variables_map`

Update the YAML config parsing logic to recognise `parameters` as the new key for action mappings. Keep backward-compatibility considerations in mind — decide whether to support `variables_map` as a deprecated alias or drop it entirely (the issue says "drop", so a hard rename is preferred).

### Step 6 — Update specs

Add or update specs for:
- `ResponseWrapper` (new class)
- `VariablesMapper` (new path-expression evaluation)
- `ResourceRequest` / `ResourceRequestAction` (new signature)
- `Client` (response wrapper output)
- `ConfigParser` (new `parameters` key)

### Step 7 — Update documentation and README

- Update `docs/agents/architecture.md` to document the new `ResponseWrapper` class and the updated `VariablesMapper` behaviour.
- Update `docs/agents/flow.md` if the action enqueueing flow description references the old approach.
- Update `README.md` and DockerHub description with the new `parameters` YAML syntax and examples.

## Files to Change

- `source/lib/models/ResponseWrapper.js` — new class (response wrapper exposing `parsed_body` and `headers`)
- `source/lib/models/VariablesMapper.js` — updated to evaluate path expressions against `ResponseWrapper`
- `source/lib/models/ResourceRequest.js` — updated `enqueueActions` signature to accept response wrapper
- `source/lib/models/ResourceRequestAction.js` — updated to pass `ResponseWrapper` to `VariablesMapper`
- `source/lib/services/Client.js` — updated to produce/return a `ResponseWrapper`
- `source/lib/services/ConfigParser.js` — updated to parse `parameters` key instead of `variables_map`
- `source/lib/exceptions/` — update or rename `MissingMappingVariable` if the semantics change
- `source/spec/lib/models/ResponseWrapper_spec.js` — new spec
- `source/spec/lib/models/VariablesMapper_spec.js` — updated spec
- `source/spec/lib/models/ResourceRequest_spec.js` — updated spec
- `source/spec/lib/models/ResourceRequestAction_spec.js` — updated spec
- `source/spec/lib/services/Client_spec.js` — updated spec
- `source/spec/lib/services/ConfigParser_spec.js` — updated spec
- `docs/agents/architecture.md` — document new classes and updated behaviour
- `docs/agents/flow.md` — update action enqueueing flow description if needed
- `README.md` — update YAML config examples

## Notes

- The issue says "drop" `variables_map` — no backward-compatible alias is planned. All existing config files using `variables_map` will need to be migrated.
- The path expression evaluator in `VariablesMapper` should be kept simple: support dot notation (`parsed_body.id`) and bracket notation for headers (`headers['page']`). Avoid pulling in a full expression engine.
- `ResponseParser` already handles JSON parsing; `ResponseWrapper.parsed_body` should delegate to it or inline the same logic.
- `ActionsExecutor` is marked as legacy in the architecture docs — it may still reference `variables_map`; check and update or leave a note for the removal follow-up.
- DockerHub description update is a deployment/publishing step, not a code change — flag it in the PR description.
