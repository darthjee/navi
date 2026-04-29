# Issue: Reverse Logs

## Description
`BufferedLogger` currently appends new log entries to the end of the buffer and reads from the beginning. This makes querying for recent logs slower as the buffer grows. The storage order should be reversed so that new logs are inserted at the beginning and removed from the end, improving access time for the most recent entries.

## Problem
- New log entries are appended to the end of the `LogBuffer`
- Queries for recent logs must traverse the entire buffer from the start
- Performance degrades as the buffer grows

## Expected Behavior
- New log entries are inserted at the beginning of the buffer
- Old entries are removed from the end when the buffer is full
- Methods such as `getLogs` reverse the internal order before returning, so consumers always receive logs in chronological order (oldest first)

## Solution
- Change `LogBuffer` to prepend new entries instead of appending them
- Adjust the eviction strategy to remove from the end instead of the front
- Update `getLogs` (and any similar read methods) to reverse the internal array before returning

## Benefits
- Faster access to the most recent log entries
- More efficient querying for recent activity

---
See issue for details: https://github.com/darthjee/navi/issues/424
