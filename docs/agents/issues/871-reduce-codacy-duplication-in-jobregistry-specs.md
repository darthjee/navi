# Issue: Reduce Codacy duplication in JobRegistry specs

## Description
Codacy reports 18% code duplication for the repository (the project goal is 10%). This issue tackles the `JobRegistry_*_spec.js` files, led by `JobRegistry_jobsByStatus_spec.js`.

Figures below come from Codacy's analysis of `main` at `f25bf98`.

## Problem
| File | Lines | Clones | Duplicated lines |
| --- | ---: | ---: | ---: |
| `source/spec/lib/registry/JobRegistry_jobsByStatus_spec.js` | 159 | 30 | 280 |
| `source/spec/lib/registry/JobRegistry_stats_spec.js` | 158 | 8 | 49 |
| `source/spec/lib/registry/JobRegistry_pick_spec.js` | 103 | 8 | 120 |
| `source/spec/lib/registry/JobRegistry_retryJob_spec.js` | 70 | 4 | 44 |
| `source/spec/lib/registry/JobRegistry_fail_spec.js` | 62 | 4 | 27 |

- `JobRegistry_jobsByStatus_spec.js` contains one 6-line block repeated 9 times (45-50, 62-67, 76-81, 90-95, 105-110, 142-147, 155-160, 169-174, 183-188), plus larger paired blocks (41-53 vs 138-150, 58-71 vs 151-164, 72-85 vs 165-178, 101-117 vs 179-195)
- The file header (1-14) is shared verbatim with `JobRegistry_enqueue_spec.js`, and a block (110-117 / 188-195) is shared with `JobRegistry_stats_spec.js` (135-142)
- `jobsByStatus` (and `jobById`, in the same file) and `stats` all walk the same six scenarios: enqueued, processing, finished, failed, retryQueue and dead. Each one re-declares the same enqueue/pick/finish/fail/promote setup
- The "exhaust a job" idiom (three `try { job._fail(new Error()); } catch { /* expected */ }` lines) is copied in several specs
- `JobRegistry_stats_spec.js` builds its own `ClientRegistry`, queues and collections by hand instead of using `JobRegistryUtils.setup()`

## Expected Behavior
Codacy reports markedly fewer duplication clones for the files above, and behaviour is unchanged (the affected specs still pass and still verify the same scenarios).

## Solution
- Add a shared scenarios helper under `source/spec/support/utils/` (extending `JobRegistryUtils` or a sibling file) that defines the six job-lifecycle scenarios (name + setup returning the job). `jobsByStatus`, `jobById` and `stats` iterate it, supplying only their own expected value per scenario, so a new scenario is one line
- Add an exhaust helper (e.g. `JobRegistryUtils.exhaust(job)`) replacing the repeated three-line `try { job._fail(...) } catch` block. Apply it **everywhere it is repeated** in `source/spec` — including `FailureChecker_spec.js` — not just in the JobRegistry specs
- Migrate `JobRegistry_stats_spec.js` to `JobRegistryUtils.setup()`, dropping the hand-built `ClientRegistry`/queue setup, provided the specs still pass without `clients` (its `enqueue` calls only pass `parameters`)
- Extend `JobRegistryUtils` where useful for the remaining duplication in `pick`, `retryJob` and `fail` (e.g. the repeated enqueue/pick/fail/promote sequences and the `JobRegistry.reset(); JobRegistry.build({ cooldown })` re-setup)
- Note: `source/spec/support/utils/` already hosts shared spec helpers (e.g. `JobRegistryUtils`, `LoggerUtils`), so new helpers belong there
- Keep every existing assertion and scenario: the refactor must not reduce what the specs verify or change any production code
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read

## Benefits
- Lowers the repository duplication percentage reported by Codacy
- Makes the affected files shorter and easier to extend, so new scenarios need one line instead of a copied block
