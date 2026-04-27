# Plan: Improve View in the Frontend — Backend

## Overview

Extend `JobShowSerializer` to expose status-specific fields (`lastError`, `backtrace`) and limit existing optional fields to the statuses where they are meaningful.

## Context

The serializer currently returns the same shape for every status. Fields like `remainingAttempts` and `readyInMs` are irrelevant for `finished` and `dead` jobs, and `lastError`/`backtrace` are not exposed at all. The frontend needs richer, status-aware data to render the correct view.

`lastError` is an exception object stored on the job when `job._fail(error)` is called. It is `null` until the job fails for the first time. `backtrace` is derived from that same exception.

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
| `lastError` | `failed`, `dead` (only when present) |
| `backtrace` | `failed`, `dead` (only when `lastError` is present) |

`lastError` and `backtrace` are included together whenever the job has a recorded error (`lastError !== null`), and omitted otherwise. Neither field ever appears in the index serializer (`JobIndexSerializer`).

### Step 2 — Update serializer tests

#### `enqueued`
- Job with no error: returns `id`, `status`, `attempts`, `jobClass`, `arguments`, `remainingAttempts`. Does **not** include `readyInMs`, `lastError`, or `backtrace`.

#### `processing`
- Job with no error: returns `id`, `status`, `attempts`, `jobClass`, `arguments`, `remainingAttempts`. Does **not** include `readyInMs`, `lastError`, or `backtrace`.

#### `failed` — without error (first retry, `_fail` not yet called)
- Returns `id`, `status`, `attempts`, `jobClass`, `arguments`, `remainingAttempts`, `readyInMs`. Does **not** include `lastError` or `backtrace`.

#### `failed` — with error (`_fail` called at least once)
- Returns all `failed` fields plus `lastError` (exception message) and `backtrace` (stack trace string).
- Assert that `lastError` matches the message of the exception passed to `_fail`.
- Assert that `backtrace` is present and non-empty.

#### `finished`
- Returns only `id`, `status`, `attempts`, `jobClass`, `arguments`. Does **not** include `remainingAttempts`, `readyInMs`, `lastError`, or `backtrace`.

#### `dead` — without error (edge case)
- Returns `id`, `status`, `attempts`, `jobClass`, `arguments`. Does **not** include `lastError` or `backtrace`.

#### `dead` — with error
- Returns all common fields plus `lastError` and `backtrace`.
- Assert that `lastError` matches the exception message and `backtrace` is present.

#### Index serializer (`JobIndexSerializer`) — regression
- For a `failed` or `dead` job with a recorded error, assert that `lastError` and `backtrace` are **not** present in the index output.

## Files to Change

- `source/lib/server/serializers/JobShowSerializer.js` — conditional field inclusion per status and per error presence.
- `spec/lib/server/serializers/JobShowSerializer_spec.js` — full scenario matrix as described above.

## Notes

- `lastError` is an exception set via `job._fail(error)`; it is `null` until the job fails for the first time.
- `backtrace` is always included alongside `lastError` — they are never split.
- Neither `lastError` nor `backtrace` must ever appear in `JobIndexSerializer`.
