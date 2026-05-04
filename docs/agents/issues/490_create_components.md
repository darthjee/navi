# Issue: Create Components

## Description

There is a significant amount of HTML rendering logic embedded directly in helper methods that could be extracted into reusable React components. Refactoring this code improves separation of concerns, maintainability, and reusability across the frontend.

## Problem

- HTML rendering is tightly coupled inside helper methods rather than being encapsulated in dedicated components.
- The following methods contain extractable HTML:
  - `BaseUrlsMenuHelper#renderDropdownMenu` — should become a `DropdownMenuContent` component
  - `BaseUrlsMenuHelper#renderDropdown` — should become a `DropdownMenu` component

## Expected Behavior

- Each piece of UI logic lives in its own component file.
- Helper methods delegate rendering to the appropriate component rather than building HTML inline.

## Solution

- Extract the HTML from `BaseUrlsMenuHelper#renderDropdownMenu` into a `DropdownMenuContent` component.
- Extract the HTML from `BaseUrlsMenuHelper#renderDropdown` into a `DropdownMenu` component.
- Update `BaseUrlsMenuHelper` to use the new components.

## Benefits

- Improved code reuse across the frontend.
- Easier to test individual UI pieces in isolation.
- Cleaner separation between logic (helpers) and presentation (components).

---
See issue for details: https://github.com/darthjee/navi/issues/490
