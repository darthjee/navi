# Part 4 — Router Refactor

## Goal

Simplify `dev/app/lib/Router.js` to use only the unified registry, removing all branching between content and redirect handler types.

## Steps

- Replace the two registry instantiations with a single instance of the unified registry.
- Remove any logic in `Router.js` that distinguishes between content and redirect routes.
- Ensure all routes (content + redirect) are registered through the single registry.

## Files to Change

- `dev/app/lib/Router.js` — use single unified registry

## Open Questions

- Does `Router.js` have any other logic beyond registry wiring that may need to be updated?
