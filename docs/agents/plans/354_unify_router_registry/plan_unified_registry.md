# Part 3 — Unified Registry

## Goal

Replace the two separate registries (`RouteRegister` and `RedirectRegister`) with a single registry that works with any `RequestHandler` subclass.

## Steps

- Review `RouteRegister.js` and `RedirectRegister.js` to understand what each provides.
- Merge the registration logic into a single class (either extend `RouteRegister` or create a new unified class).
- The unified registry must store and dispatch any `RequestHandler` subclass without branching on handler type.
- Delete or deprecate `RedirectRegister.js` once its logic is absorbed.

## Files to Change

- `dev/app/lib/RouteRegister.js` — absorb redirect registration logic (or replace with new unified class)
- `dev/app/lib/RedirectRegister.js` — remove once unified
- `dev/app/lib/routes.config.js` and `dev/app/lib/redirect_routes.config.js` — determine whether to merge or keep separate

## Open Questions

- Do `RouteRegister` and `RedirectRegister` differ only in the handler type they accept, or also in how they register routes (path patterns, middleware, etc.)?
- Should `redirect_routes.config.js` be merged into `routes.config.js`, or kept separate for clarity?
