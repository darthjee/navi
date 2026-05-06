# Plan: Pass More Information for Jobs

## Overview

Propagate the originating URL from `ResourceRequestJob` to downstream jobs so that the full trigger chain is visible in the API and the web UI.

## Context

The first job in the pipeline is always a `ResourceRequestJob`, which holds the URL being warmed. When it enqueues downstream jobs (`HtmlParseJob`, `ActionProcessingJob`, `PaginatedActionProcessingJob`), that URL is currently lost. This makes it impossible to trace which resource triggered a given job from the API or the show-job page.

## Sub-plans

- [Backend](plan_backend.md) — job classes, enqueuers, serializer, and API handlers
- [Frontend](plan_frontend.md) — show-job page and jobs listing

## Notes

- The `originUrl` field should be optional (nullable) so that `ResourceRequestJob` itself does not need to carry it — it is the origin.
- No database or persistence layer is involved; jobs are in-memory only.
