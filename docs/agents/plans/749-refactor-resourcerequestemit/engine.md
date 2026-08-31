# engine Plan: Refactor ResourceRequestEmit

Main plan: [plan.md](plan.md)

## Overview

`ResourceRequestEmit` (`source/lib/models/request/ResourceRequestEmit.js`) currently owns validation, URL token resolution, and the entire body-template rendering pipeline (template walk, string interpolation, dot-path token resolution) as private methods on one class. `resolveUrl`'s logic is also duplicated verbatim in `ResourceRequest.js`.

This plan extracts four dedicated, stateless, static-method classes — following the existing `ClientReference.js` convention (a static `parse(...)` class already shared between `ResourceRequest` and `ResourceRequestEmit`) — and rewires both models to delegate to them. No behavior change is expected; several specific existing behaviors (documented per-step below) must survive the move unchanged.

## Context

- `ClientReference.js` (`source/lib/models/request/ClientReference.js`) is the precedent: a small static-method class with no dedicated spec file (it's exercised indirectly through the models that use it). For this issue, given the number of subtle edge-case behaviors involved, each new class gets its own dedicated spec file for direct coverage.
- All four new classes are pure/stateless — no constructor state, called via static methods only (e.g. `TokenResolver.resolve(path, item)`), never instantiated.

## Steps

- [01 — Extract UrlTokenResolver](engine/01-extract-url-token-resolver.md)
- [02 — Extract TokenResolver](engine/02-extract-token-resolver.md)
- [03 — Extract TemplateStringRenderer](engine/03-extract-template-string-renderer.md)
- [04 — Extract BodyTemplateRenderer and wire resolveBody](engine/04-extract-body-template-renderer.md)

## CI Checks

- `source`: `npm run coverage` (CI job: `jasmine`)
- `source`: `npm run lint` (CI job: `checks`)

## Notes

- Step order is bottom-up: `TokenResolver` before `TemplateStringRenderer` (which calls it) before `BodyTemplateRenderer` (which calls `TemplateStringRenderer`). `UrlTokenResolver` is independent and extracted first since it's the simplest, self-contained change.
- `ResourceRequestEmit`'s and `ResourceRequest`'s public methods (`resolveUrl`, `resolveBody`) keep their exact existing signatures and return values — only their internals change to thin delegations.
- Existing specs (`ResourceRequestEmit_spec.js`, `ResourceRequest_spec.js`) should keep passing unchanged, since the public behavior isn't changing; only add to them if a private-method test double directly referenced internals that no longer exist.
