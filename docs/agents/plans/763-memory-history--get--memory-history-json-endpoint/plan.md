# Plan: Memory history: GET /memory/history.json endpoint

Issue: [763-memory-history--get--memory-history-json-endpoint.md](../../issues/763-memory-history--get--memory-history-json-endpoint.md)

## Overview

Expose the already-built `MemoryRegistry` sampling buffer (landed in #762) over
HTTP as a new `GET /memory/history.json` endpoint, mirroring the existing
`/logs.json` pattern: a bare, oldest-first, `page_size`-capped, `last_id`-filterable
JSON array of `{ id, value, percentage, timestamp }`. Backend-only plumbing —
handler, serializer, route, and specs.

See [engine.md](engine.md) for the full plan.
