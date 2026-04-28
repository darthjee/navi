# Issue: Reduce and Organize Header

## Description

The header in the frontend displays workers and jobs information but is currently too large.
It needs to be redesigned to fit in a single row using smaller buttons, with a clear visual
separation between the workers section and the jobs section.

## Problem

- The header occupies too much vertical space.
- There is no clear visual distinction between workers-related controls and jobs-related controls.

## Expected Behavior

- The header fits in a single row.
- Buttons in the header are smaller than the current ones.
- Workers and jobs are visually separated within the header (e.g. via grouping, divider, or
  distinct sections).

## Solution

- Redesign the header component in `frontend/` to use a compact, single-row layout.
- Reduce button size.
- Add a clear visual separator or grouping between the workers section and the jobs section.

## Benefits

- More compact UI, giving more screen space to the main content.
- Clearer at a glance which controls belong to workers and which to jobs.

---
See issue for details: https://github.com/darthjee/navi/issues/408
