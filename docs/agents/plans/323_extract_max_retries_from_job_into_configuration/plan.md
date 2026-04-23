# Plan: Extract max retries from job into configuration

## Overview

Expose the maximum number of job retries as a user-configurable YAML option under `workers.max-retries`, replacing any hardcoded limit in the job or registry logic with the value read from `WorkersConfig`.

## Context

`Job` (in `source/lib/models/`) tracks a failure counter (`_attempts`) and is the likely location of the hardcoded retry limit that determines when a job stops being retried and moves to the `dead` queue. `WorkersConfig` already models worker pool settings; a new `maxRetries` field should be added there. The fix connects the YAML → `WorkersConfig` → `Job` / `JobRegistryInstance` chain, mirroring the approach taken for the cooldown in issue #322.

## Implementation Steps

### Step 1 — Add `maxRetries` to `WorkersConfig`

Update `WorkersConfig.fromObject()` to parse the `max-retries` key from the `workers:` YAML block and store it as `maxRetries`. Keep the current hardcoded default when the key is absent.

### Step 2 — Pass `maxRetries` into `Job` or `JobRegistryInstance`

Determine where the retry limit is consumed (likely `Job` base class or `JobRegistryInstance`) and update the construction/build path so the configured `maxRetries` value is passed in rather than relying on a hardcoded literal.

### Step 3 — Remove the hardcoded limit

Locate and remove the hardcoded max-retries literal, replacing it with the value sourced from `WorkersConfig`.

### Step 4 — Wire through `Application` / `ConfigParser`

Verify that `Application` (or `ConfigParser`) passes the `WorkersConfig` instance (or its `maxRetries` value) to wherever `Job` or `JobRegistryInstance` is constructed, completing the end-to-end wiring.

### Step 5 — Update tests

- Add/update a spec for `WorkersConfig` to assert that `max-retries` is parsed from the YAML object and falls back to the default.
- Add/update a spec for `Job` or `JobRegistryInstance` to assert that the configured `maxRetries` is respected when deciding whether a job is exhausted.

### Step 6 — Document the new option

Add `max-retries` to the configuration reference (e.g., `docs/agents/flow.md`), describing the key, its type (integer), and its default value.

## Files to Change

- `source/lib/models/WorkersConfig.js` — parse `max-retries` from YAML, expose as `maxRetries`
- `source/lib/models/Job.js` — replace hardcoded retry limit with the configured `maxRetries` value
- `source/lib/registry/JobRegistryInstance.js` — pass `maxRetries` through if the limit is checked here
- `source/lib/services/Application.js` or `ConfigParser.js` — verify wiring from parsed config to job/registry construction
- `source/spec/lib/models/WorkersConfig_spec.js` — test new YAML parsing
- `source/spec/lib/models/Job_spec.js` — test max-retries propagation
- `docs/agents/flow.md` (or equivalent) — document the new `workers.max-retries` key

## Notes

- The existing default must be preserved to avoid breaking configurations that omit `max-retries`.
- `ActionProcessingJob` has no retry rights per the architecture docs — the limit only applies to `ResourceRequestJob` failures; confirm whether `maxRetries` should be enforced at the `Job` base class level or only in the subclass.
- Open question: is the retry limit checked in `Job` itself (e.g., via `_attempts`) or in `JobRegistryInstance` when deciding whether to move a job to `dead`? Code inspection will clarify.
