# Plan: Navi: expose Job#endedAt in job serializers

Issue: [1021-navi-expose-job-endedat-in-job-serializers.md](../../issues/1021-navi-expose-job-endedat-in-job-serializers.md)

## Overview

Surface deku-swarm's `Job#endedAt` (epoch ms, set by `markEnded()` on finish/dead, cleared by `clearEnded()` on retry) in navi. The `engine` adds an always-present `endedAt` field (ISO 8601 string or `null`) to both `JobIndexSerializer` and `JobShowSerializer`, and documents it in `docs/agents/web-server.md`. The `frontend` renders it as an "Ended at" column in the jobs table and an "Ended at" row on the job detail page, both via the existing `formatTimestamp`.

## Agents involved

- [engine](engine.md)
- [frontend](frontend.md)

## Shared contracts

Both `GET /jobs/:status.json` (each item, via `JobIndexSerializer`) and `GET /job/:id.json` (via `JobShowSerializer`) gain:

| Field | Type | Present | Value |
|-------|------|---------|-------|
| `endedAt` | `string \| null` | always, every status | `new Date(job.endedAt).toISOString()` (e.g. `"2026-11-17T12:34:56.789Z"`) when `job.endedAt` is a number; `null` when `job.endedAt` is `null` or `undefined`. |

- The value is driven by `job.endedAt`, **not** by the status label (no status set gates it).
- In practice it is non-null only for `finished` and `dead` jobs; a retried dead job reads `null` again until it ends anew (latest end only, no history).
- No other field changes. The navi-client and deku-swarm are untouched.
