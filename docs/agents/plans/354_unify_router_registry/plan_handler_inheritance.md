# Part 2 — Handler Inheritance

## Goal

Make all existing request handlers extend the base `RequestHandler` class and implement its unified API.

## Steps

- Identify all handler classes in `dev/app/lib/` (e.g. `RedirectHandler.js` and any content handler).
- For each handler that does not already extend `RequestHandler`, update it to do so.
- Ensure each handler implements the method defined in Part 1.
- Remove any duplicated logic that is now covered by the base class.

## Files to Change

- `dev/app/lib/RedirectHandler.js` — extend `RequestHandler`, implement unified API
- Any other handler class that does not yet inherit from `RequestHandler`

## Open Questions

- Does the content handler already extend `RequestHandler`?
- Are there any differences in how content vs. redirect handlers respond that need to be reconciled in the base class?
