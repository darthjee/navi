# Plan: Memory history: usage chart + MemoryStatus page integration

Issue: [765-memory-history--usage-chart---memorystatus-page-integration.md](../../issues/765-memory-history--usage-chart---memorystatus-page-integration.md)

## Overview

Render the memory-history points already exposed by `MemoryChartController`
(#764) as a live `recharts` line graph on `/#/memory/status`, below the
existing status card, reusing the page's existing `/memory/status.json` poll
for `maximum`/`status` — no backend change, no extra request.

See [frontend.md](frontend.md) for the full plan.
