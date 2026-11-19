# Engine Plan: Navi: exclude in-flight jobs from the failure ratio and report them separately

Main plan: [plan.md](plan.md)

## Overview
All code changes live in `source/lib/services/execution/`: `LifetimeJobStats` gains the single ratio source, `RunSummary` consumes a `LifetimeJobStats` instead of raw numbers, `FailureChecker` drops its private ratio math, and `RunReporter` wires one stats instance into both. Agent docs describing these classes are updated last.

## Context
Today `RunReporter` passes `failedJobs = unresolved + dead` to `RunSummary` while `FailureChecker` uses `dead`, both over `total = finished + dead`. With jobs left in `failed`/`retryQueue` (paused shutdown, no `clearQueues()`), the summary can print >100% and `Result: Failure` while the process exits 0. The issue settles on the terminal-only definition (which `FailureChecker` already uses), so exit-code behaviour is unchanged.

## Steps

- [01 — Add LifetimeJobStats.percentage](engine/01-lifetime-job-stats-percentage.md)
- [02 — RunSummary consumes LifetimeJobStats and prints Unresolved](engine/02-run-summary-stats.md)
- [03 — FailureChecker and RunReporter use the shared ratio](engine/03-failure-checker-and-run-reporter.md)
- [04 — Update agent docs](engine/04-agent-docs.md)

## CI Checks
- `source`: `cd source && npm run coverage` and `cd source && npm run lint` (CircleCI jobs for `source`)

## Notes
- `RunSummary` is not exported outside `source/` and is only constructed by `RunReporter`, so the constructor change is internal.
- Keep the `Failed:` label (it now counts dead jobs only); do not rename it.
- Out of scope: unifying the duplicated `> threshold` checks, `clearQueues()` on paused shutdown, reporting `enqueued`/`processing` jobs (#1032), `JobRegistry.stats()` shape.
