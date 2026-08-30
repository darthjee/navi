# Plan: Crawler: implement tracking and observability for EmitJob emissions

Issue: [703-crawler-implement-tracking-and-observability-for-emitjob-emissions.md](../../issues/703-crawler-implement-tracking-and-observability-for-emitjob-emissions.md)

## Overview

Add in-memory tracking of crawler extraction/emission activity — monotonic counters
(`extracted` / `emitted` / `failed` / `dead`) plus a bounded ring buffer of per-emission
records — reusing the `LogBuffer` / `MemoryDataStore` ring-buffer pattern and the
`LogRegistry` static-facade wiring pattern. `ExtractionJob` and `EmitJob` write to a new
`EmissionRegistry`; the data is exposed over `GET /emissions.json` and cleared on engine
stop. All work is within the `engine` specialist's scope (`source/`, plus the
`docs/agents/` architecture docs that describe it).

See [engine.md](engine.md) for the full plan.
