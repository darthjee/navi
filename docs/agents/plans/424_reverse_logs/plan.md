# Plan: Reverse Logs

## Overview

Reverse the internal storage order of `LogBuffer` so that new entries are prepended instead of appended. Read methods return logs in chronological order by reversing the internal array before returning.

## Context

`BufferedLogger` appends new entries to the end of `LogBuffer` and reads from the beginning. As the buffer grows, querying recent logs is slower because they are at the far end. Storing logs in reverse order (newest first internally) makes recent entries immediately accessible.

## Implementation Steps

### Step 1 — Change `LogBuffer` to prepend new entries

Modify the add/push method in `LogBuffer` to insert new entries at the beginning of the internal array instead of appending to the end. Adjust the eviction strategy accordingly: when the buffer is full, remove from the end (the oldest entry) instead of the front.

### Step 2 — Update read methods to reverse before returning

Update `getLogs` (and any similar method that exposes the log list) to reverse the internal array before returning, so consumers always receive logs in chronological order (oldest first), preserving the existing external contract.

### Step 3 — Update the spec

Update `source/spec/lib/utils/logging/LogBuffer_spec.js` to:
- Verify the new internal storage order (newest first)
- Confirm that read methods still return logs in chronological order
- Confirm that eviction still removes the oldest entry when the buffer is full

## Files to Change

- `source/lib/utils/logging/LogBuffer.js` — prepend instead of append; evict from end; reverse on read
- `source/spec/lib/utils/logging/LogBuffer_spec.js` — updated specs for new storage behavior

## Notes

- The external contract (consumers receive logs oldest-first) must not change.
- Only `LogBuffer` needs to change — `BufferedLogger` and other callers are unaffected as long as the public API returns the same order.
