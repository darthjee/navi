# Part 1 — Base RequestHandler

## Goal

Ensure `dev/app/lib/RequestHandler.js` defines the full common API that all route handlers must implement.

## Steps

- Review the current `RequestHandler.js` to understand what it already provides.
- Define the method that all handlers must implement (e.g. `handle(req, res)`).
- If the method is abstract (no meaningful default), either leave the body empty and document it, or throw a `NotImplementedError` to enforce the contract at runtime.

## Files to Change

- `dev/app/lib/RequestHandler.js` — define the unified handler API

## Open Questions

- Is `RequestHandler.js` currently used as a parent by any handler, or is it standalone?
- What is the exact method signature that all handlers must expose?
