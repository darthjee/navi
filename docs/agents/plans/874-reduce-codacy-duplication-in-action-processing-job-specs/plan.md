# Plan: Reduce Codacy duplication in action-processing job specs

Issue: [874-reduce-codacy-duplication-in-action-processing-job-specs.md](../../issues/874-reduce-codacy-duplication-in-action-processing-job-specs.md)

## Overview
Test-only refactor under `source/spec/`: introduce shared job-lifecycle and action-job examples plus an `AssetDownloadJobFactory` and a `logContext` helper, then rewrite the four job specs on top of them without changing any production code or dropping any scenario.

See [engine.md](engine.md) for the full plan.
