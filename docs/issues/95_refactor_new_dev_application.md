# 95: Refactor new-dev Router to Remove Code Duplication

https://github.com/darthjee/navi/issues/95

## Background

The `new-dev` Express application currently has significant code duplication in its routing logic. The router handles multiple endpoints (e.g., `/categories.json`, `/categories/:id.json`, `/categories/:id/items.json`, etc.) using very similar patterns for data lookup, error handling, and response formatting. This repetition makes the code harder to maintain and increases the risk of inconsistencies or bugs when adding or modifying endpoints.

## Problem

- Routing logic for each endpoint is implemented separately, but follows nearly identical steps:
  - Extract parameters from the URL.
  - Lookup data in the loaded YAML structure.
  - Return JSON responses or 404 errors.
- Any change to the data structure or error handling must be repeated in multiple places.
- Adding new endpoints or modifying existing ones requires copying and adapting similar code blocks.

## Proposal

Refactor the router to eliminate duplication by:

- Extracting common logic for data lookup and error handling into reusable helper functions or middleware.
- Defining route handlers in a more declarative or parameterized way, reducing boilerplate.
- Ensuring all endpoints use consistent response and error formats.

## Acceptance Criteria

- All routing logic in `new-dev` is DRY (Don't Repeat Yourself) and easy to maintain.
- Adding or updating endpoints requires minimal code changes.
- All existing tests pass, and new tests are added for any new helpers.
- Code is clearly documented and follows project standards.

---

This refactor will improve maintainability, reduce bugs, and make it easier to extend the Express app in the future.