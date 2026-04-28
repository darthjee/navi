# Plan: Reduce and Organize Header

## Overview

Redesign the frontend header to fit in a single compact row with smaller buttons and a clear
visual separation between the workers section and the jobs section.

## Context

The header currently takes up too much vertical space and mixes workers and jobs controls
without a clear visual distinction. The goal is a compact, organized header that gives more
room to the main content and makes it immediately obvious which controls belong to workers
and which to jobs.

## Implementation Steps

### Step 1 — Identify the header component

Locate the header component inside `frontend/src/` and understand its current structure:
which sub-components it renders, what props it receives, and how workers and jobs data
are currently displayed.

### Step 2 — Compact the layout to a single row

Update the header component so that all its content fits in a single row:

- Use `display: flex` / `flex-direction: row` (or the equivalent in the project's CSS
  approach) on the header container.
- Remove any vertical stacking or multi-line layout currently in place.

### Step 3 — Reduce button size

Reduce the size of all buttons inside the header:

- Use smaller padding and/or font size.
- Ensure buttons remain accessible and clickable at the reduced size.

### Step 4 — Add visual separation between workers and jobs

Introduce a clear separator between the workers group and the jobs group inside the header.
Options (choose the one that fits the existing design system):

- A vertical divider element (`<hr>` styled vertically, a border, or a spacer).
- Distinct background regions or border-boxes for each group.
- Labels ("Workers" / "Jobs") above or beside each group.

### Step 5 — Update tests / snapshots

If the project has component tests or visual snapshots for the header, update them to
reflect the new layout.

## Files to Change

- `frontend/src/` — header component file(s) (exact path to be confirmed after reading the
  frontend source)
- Any associated CSS / styled-component / module file for the header
- Test/snapshot files for the header component, if they exist

## Notes

- The exact component name and file path are not known yet — Step 1 resolves this.
- Follow whatever styling approach is already in use in the project (CSS modules, plain CSS,
  styled-components, Tailwind, etc.) rather than introducing a new one.
- The separation between workers and jobs should be purely visual — no logic change is needed.

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `frontend/`: check `docs/agents/frontend.md` and `.circleci/config.yml` for the applicable
  lint and test commands once the frontend tooling is confirmed.
