# Plan: Unify Router Registry

## Overview

Refactor `dev/app/lib/Router.js` to replace its two separate registries (`RouteRegister` and `RedirectRegister`) with a single unified registry. Introduce a base `RequestHandler` class that all handler types extend, so the registry can work uniformly with any handler.

## Context

The dev app router currently maintains two registries — one for content routes (`RouteRegister`) and one for redirects (`RedirectRegister`) — whose handlers expose different APIs. A base `RequestHandler` class already exists in `dev/app/lib/RequestHandler.js` but may not yet be used as a shared parent by all handler types. Unifying the registry simplifies the router and makes it trivially extensible.

## Parts

- [Part 1 — Base RequestHandler](plan_request_handler.md)
- [Part 2 — Handler Inheritance](plan_handler_inheritance.md)
- [Part 3 — Unified Registry](plan_unified_registry.md)
- [Part 4 — Router Refactor](plan_router.md)
- [Part 5 — Specs](plan_specs.md)
- [Part 6 — Documentation](plan_docs.md)
