# Plan: Crawler: wire ExtractionJob output into EmitJob and verify the worked examples end-to-end

Issue: [677-crawler-wire-extractionjob-output-into-emitjob-and-verify-the-worked-examples-end-to-end.md](../issues/677-crawler-wire-extractionjob-output-into-emitjob-and-verify-the-worked-examples-end-to-end.md)

## Overview

Wire the already-merged `ExtractionJob` and `EmitJob` together, entirely within `source/` (engine scope): a new `EmitEnqueuer` fans out one `Emit` job per extracted item, `ExtractionJob` delegates to it, and the resource's `emit`/`parameters` are threaded through from `ResourceRequest`/`ResourceRequestJob`. Verified end-to-end against both worked examples from `docs/agents/future/crawler/flows.md`, with the runtime flow docs updated to match.

See [engine.md](engine.md) for the full plan.
