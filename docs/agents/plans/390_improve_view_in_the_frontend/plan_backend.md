# Plan: Improve View in the Frontend — Backend

## Overview

Extend `JobShowSerializer` to expose status-specific fields (`lastError`, `backtrace`) and limit existing optional fields to the statuses where they are meaningful.

## Context

The serializer currently returns the same shape for every status. Fields like `remainingAttempts` and `readyInMs` are irrelevant for `finished` and `dead` jobs, and `lastError`/`backtrace` are not exposed at all. The frontend needs richer, status-aware data to render the correct view.

## Implementation Steps

### Step 1 — Extend `JobShowSerializer`

Update the serializer to build the output conditionally based on the job's status:

| Field | Statuses present |
|-------|-----------------|
| `id` | all |
| `status` | all |
| `attempts` | all |
| `jobClass` | all |
| `arguments` | all |
| `remainingAttempts` | `enqueued`, `processing`, `failed` |
| `readyInMs` | `failed` |
| `lastError` | `failed`, `dead` |
| `backtrace` | `dead` |

Return `null` (or omit) `lastError` and `backtrace` when no error has been recorded.

### Step 2 — Update serializer tests

Cover every status with the full set of expected fields. Include edge cases:

- A `failed` job where `lastError` is absent (first attempt, no error yet recorded).
- A `dead` job with both `lastError` and `backtrace` present.
- A `finished` job to assert that no extra fields are included.

## Files to Change

- `source/lib/server/serializers/JobShowSerializer.js` — conditional field inclusion per status.
- `spec/lib/server/serializers/JobShowSerializer_spec.js` — extend tests for new fields and empty-field cases.

## Notes

- Open question: is `lastError` a plain string or a structured object on the Job model? Confirm before implementing.
- `backtrace` should only be included for `dead` to keep payload size small.
