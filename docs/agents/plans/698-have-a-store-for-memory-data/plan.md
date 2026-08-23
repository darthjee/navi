# Plan: Have a store for memory data

Issue: [698-have-a-store-for-memory-data.md](../issues/698-have-a-store-for-memory-data.md)

## Overview

Add an in-memory, size-limited ring buffer for process memory readings, mirroring the existing `LogBuffer`/`Log`/`LogFactory` pipeline. This issue is scoped to the storage mechanism only — no recording loop and no read endpoint are wired up yet.

See [engine.md](engine.md) for the full plan.
