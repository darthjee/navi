# Plan: Reduce Codacy duplication in emit and extraction job specs

Issue: [873-reduce-codacy-duplication-in-emit-and-extraction-job-specs.md](../../issues/873-reduce-codacy-duplication-in-emit-and-extraction-job-specs.md)

## Overview
Test-only refactor of four job specs under `source/spec/lib/jobs/` (`EmitJob`, `ExtractionEmitFlow`, `ExtractionJob`, `HtmlParseJob`) to remove duplicated job construction, fixtures and expectation blocks, without changing any assertion or any production code.

See [engine.md](engine.md) for the full plan.
