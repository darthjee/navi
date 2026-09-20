# Issue: Reduce Codacy duplication in engine start handler specs

## Description
Codacy reports 18% code duplication for the repository (the project goal is 10%). This issue tackles the two engine-start handler specs, which repeat the same request/response setup and assertions both within and across files.

Figures below come from Codacy's analysis of `main` at `f25bf98`.

## Problem
| File | Lines | Clones | Duplicated lines |
| --- | ---: | ---: | ---: |
| `source/spec/lib/server/handlers/api/ApiEngineStartHandler_spec.js` | 352 | 36 | 241 |
| `source/spec/lib/server/handlers/engine/EngineStartHandler_spec.js` | 84 | 5 | 32 |

- `ApiEngineStartHandler_spec.js` repeats blocks internally (e.g. 245-254 vs 278-287, 122-132 vs 233-243, 174-181 vs 354-361, 290-298 vs 310-318 vs 325-333)
- It also duplicates `EngineStartHandler_spec.js` (e.g. 29-35 vs 52-58, 108-112 vs 24-28, 417-423 vs 83-89)
- Some blocks are shared with `ResourceEnqueuer_spec.js` as well (e.g. 278-283 vs 253-259), so the fix should be coordinated with the ResourceEnqueuer duplication issue (#870)

Main sources of repetition:
- The 'targets is present but malformed' block: twelve `it`s share the same three lines (build `req`, call `process()`, expect `res.status` called with 400); only the request body differs
- The `Application.isStopped` / `Application.isRunning` stub pairs (stopped, running, neither) are repeated in both specs
- The `ResourceFactory` → `Namespace` → `NamespaceMap.build` fixture with a `reports.categories` resource is rebuilt in several `beforeEach` blocks
- `expect(res.json).toHaveBeenCalledWith({ status: 'running', enqueued, skippedResources })` is repeated about ten times

## Expected Behavior
The clone count for the files above drops noticeably in Codacy (verified manually by the maintainer after merge), and behaviour is unchanged (the affected specs still pass and still verify the same scenarios).

## Solution
- Parameterise the twelve malformed-`targets` cases with a table-driven loop inside `ApiEngineStartHandler_spec.js` (`[description, body]` pairs generating the `it`s) rather than a shared helper, since it is specific to that spec
- Add two shared helpers under `source/spec/support/utils/` (which already hosts helpers such as `JobRegistryUtils` and `LoggerUtils`), owned and created by this issue:
  - an `ApplicationStateUtils` (name indicative) that stubs the engine stopped / running / neither states, used by both handler specs
  - a `NamespaceMapUtils` (name indicative) that builds the `reports.categories` namespace fixture
- The ResourceEnqueuer duplication issue (#870) should reuse these helpers if it lands later, instead of creating its own
- Keep every existing assertion and scenario: the refactor must not reduce what the specs verify or change any production code
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read
- Owning agent: `engine` (everything lives under `source/spec/`)

## Benefits
- Lowers the repository duplication percentage reported by Codacy
- Makes the affected files shorter and easier to extend, so new scenarios need one line instead of a copied block
