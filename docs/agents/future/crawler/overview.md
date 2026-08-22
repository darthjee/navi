# Overview

Navi is currently a **queue-based cache-warmer** written in Node.js, designed to run inside Docker. It reads a YAML configuration file, discovers which HTTP resources can be requested immediately (no parameters required), fires those requests concurrently using a configurable worker pool, and chains the responses into further parameterised requests — repeating until the entire resource graph has been warmed. An optional read-only web monitoring interface allows observing jobs and workers in real time.

This feature **extends Navi beyond cache-warming**, turning it into an **information crawling tool**. When processing the response of a URL, Navi will be able to — in addition to chaining children URLs (existing behavior) — **extract structured data** using configurable parsers and **emit each extracted item** to an external endpoint.

## Job Pipeline (current vs. proposed)

```
ResourceRequestJob (performs the HTTP request — EXISTING)
       │
       ├─→ ActionProcessingJob (chaining — EXISTING)
       │     maps parameters and enqueues child ResourceRequestJobs
       │
       ├─→ HtmlParseJob (assets — EXISTING)
       │     extracts URLs from CSS/JS and enqueues AssetDownloadJobs
       │
       └─→ ExtractionJob (NEW)
             uses the configured parser to extract data from the raw body
               │
               ├─→ EmitJob (NEW — one per item)
               │     sends the extracted payload to an external endpoint
               │
               └─→ [child chaining reuses ActionProcessingJob]
```

The `ExtractionJob` is **parallel** to existing jobs — it does not replace chaining, it adds a new processing branch. A resource can have `actions` (chaining), `assets` (download), and `parser` + `emit` (extraction and emission) simultaneously, or any subset.

## Objectives

1. **Allow extraction of structured data** from HTTP responses (JSON, HTML, plain text) — not just URL chaining
2. **Support multiple parser types**, selected explicitly in the YAML per resource
3. **Send each extracted item individually** to a configurable external endpoint, via `EmitJob`
4. **Preserve the existing chaining mechanism** for children URL discovery — no changes to the current architecture
5. **Maintain backward compatibility** — existing cache-warming configurations continue to work without modification
6. **Reuse the existing clients infrastructure** — the `EmitJob` references a `client` from the YAML to know where to send data
