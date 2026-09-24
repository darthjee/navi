# Plan: Reduce the size of EmitJob_spec.js

Issue: [933-reduce-the-size-of-emitjob-spec-js.md](../../issues/933-reduce-the-size-of-emitjob-spec-js.md)

## Overview
Split the 588-line `source/spec/lib/jobs/EmitJob_spec.js` into three spec files under a new `source/spec/lib/jobs/emit_job/` folder, each under the 300-line ESLint `max-lines` limit. The closure-based local helpers move into a new `EmitJobSpecUtils` support util so every file can share them. This is spec-only work inside `source/`, owned by the `engine` agent.

See [engine.md](engine.md) for the full plan.
