# Plan: Reduce Codacy duplication in RouteRegister specs

Issue: [868-reduce-codacy-duplication-in-routeregister-specs.md](../../issues/868-reduce-codacy-duplication-in-routeregister-specs.md)

## Overview
Remove the copy-pasted setup, invoke sequence and per-error scenarios from the three `RouteRegister` spec files by moving them into one shared spec helper under `source/spec/support/utils/`. Test-only change: no production code is touched.

See [engine.md](engine.md) for the full plan.
