# Issue: Reduce Codacy duplication in RouteRegister specs

## Description
Codacy reports 18% code duplication for the repository (the project goal is 10%). This issue tackles the three `RouteRegister` spec files under `source/spec/lib/server/`, which together are the most duplicated files in the repository (145 clones).

Figures below come from Codacy's analysis of `main` at `f25bf98`.

## Problem
| File | Lines | Clones | Duplicated lines |
| --- | ---: | ---: | ---: |
| `source/spec/lib/server/RouteRegister_patch_spec.js` | 127 | 50 | 514 |
| `source/spec/lib/server/RouteRegister_spec.js` | 160 | 49 | 420 |
| `source/spec/lib/server/RouteRegister_post_spec.js` | 115 | 46 | 426 |

- `RouteRegister_patch_spec.js` and `RouteRegister_post_spec.js` share an identical header/`beforeEach`/`afterEach` (Logger suppression, `LogRegistry.build()`, `LoggerUtils` stubs, router spy, `new RouteRegister(router)`), duplicated at lines 1-17 in both files and again in `RouteRegister_spec.js`
- Inside `RouteRegister_patch_spec.js` the same 8-line stub-and-invoke sequence repeats 8 times (lines 38-45, 51-58, 68-75, 84-91, 100-107, 118-125, 136-143, 154-161): build a `handler` spy, a `req`, a `res` (with `status().json` spies), call `register.registerPatch(...)`, then pull the callback via `router.patch.calls.mostRecent().args[1]` and `await` it
- The per-error scenarios (`when the handler throws a ConflictError` -> 409, and the equivalents for `ForbiddenError`/`NotFoundError`) are written out by hand in every file and again per HTTP method (e.g. patch:150-156, post:134-140, spec:163-169 and 179-185)

## Expected Behavior
Codacy reports markedly fewer duplication clones for the files above, and behaviour is unchanged (the affected specs still pass and still verify the same scenarios).

## Solution
- Extract the shared setup (Logger suppression, `LogRegistry.build()`, `LoggerUtils` stubs, router spy, `new RouteRegister(router)`, and the matching `afterEach`) into a support helper used by all three files; the helper must let each file choose which router methods are stubbed (`get`/`post`/`patch`), since that is the only difference between the three headers
- Add a helper that registers a route and invokes the captured callback with given `handler`/`req`/`res`, so each scenario shrinks to its assertion. The helper always `await`s the callback: the GET spec currently invokes it synchronously, but awaiting a synchronous callback is harmless, and the GET specs must still verify the same behaviour
- Add a shared example, parameterised by HTTP verb (`register`/`registerPost`/`registerPatch` plus the matching router method), that generates the per-error-type scenarios (`ConflictError` -> 409, `ForbiddenError` -> 403 and its `Forbidden` body, `NotFoundError` -> 404, unexpected error -> 500). Each spec file calls it once instead of writing the scenarios out by hand
- Keep the three spec files (`RouteRegister_spec.js`, `RouteRegister_post_spec.js`, `RouteRegister_patch_spec.js`) at their current paths; only their contents shrink
- Note: `source/spec/support/utils/` already hosts shared spec helpers (e.g. `JobRegistryUtils`, `LoggerUtils`), so new helpers belong there
- Before extracting the shared error example, check that every scenario it will generate exists for every verb today (e.g. the GET spec may not cover `ConflictError`); scenarios a verb never had must not be silently added or dropped, so either keep the per-verb list explicit or record the difference in the PR
- Keep every existing assertion and scenario: the refactor must not reduce what the specs verify or change any production code
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read

## Benefits
- Lowers the repository duplication percentage reported by Codacy
- Makes the affected files shorter and easier to extend, so new scenarios need one line instead of a copied block

