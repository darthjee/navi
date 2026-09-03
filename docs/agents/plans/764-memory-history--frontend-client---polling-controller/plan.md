# Plan: Memory history: frontend client + polling controller

Issue: [764-memory-history--frontend-client---polling-controller.md](../issues/764-memory-history--frontend-client---polling-controller.md)

## Overview

Add the frontend data layer for the memory-usage history chart (part of #761): a
client function that fetches `/memory/history.json` and a hand-rolled polling
controller that accumulates and caps the resulting points, so a later sub-issue can
focus purely on rendering.

See [frontend.md](frontend.md) for the full plan.
