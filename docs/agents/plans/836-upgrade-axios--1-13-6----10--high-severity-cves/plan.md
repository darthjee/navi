# Plan: Upgrade axios (1.13.6) — 10+ High severity CVEs

Issue: [836-upgrade-axios--1-13-6----10--high-severity-cves.md](../../issues/836-upgrade-axios--1-13-6----10--high-severity-cves.md)

## Overview
Bump the `axios` dependency in the `source/` workspace from `1.13.6` to `1.20.0` (latest) to close all currently known High/Moderate CVEs, re-locking both `source/package-lock.json` and `source/yarn.lock`. The `frontend/` workspace has no `axios` dependency (direct or transitive), so it needs no changes.

See [engine.md](engine.md) for the full plan.
