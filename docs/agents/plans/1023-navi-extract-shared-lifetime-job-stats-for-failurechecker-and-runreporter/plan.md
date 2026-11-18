# Plan: Navi: extract shared lifetime job stats for FailureChecker and RunReporter

Issue: [1023-navi-extract-shared-lifetime-job-stats-for-failurechecker-and-runreporter.md](../../issues/1023-navi-extract-shared-lifetime-job-stats-for-failurechecker-and-runreporter.md)

## Overview

Pure internal refactor in `source/lib/services/execution/`: extract the lifetime job-count formula (resident + pruned) duplicated in `FailureChecker` and `RunReporter` into a new `LifetimeJobStats` value object, with no change to ratios, exit codes or log output. Single owner: the engine agent.

See [engine.md](engine.md) for the full plan.
