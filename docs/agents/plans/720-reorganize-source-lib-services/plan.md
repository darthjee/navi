# Plan: Reorganize source/lib/services

Issue: [720-reorganize-source-lib-services.md](../issues/720-reorganize-source-lib-services.md)

## Overview

Split the 16 loose files in `source/lib/services` into five responsibility-based
subfolders, extract `Client.js` into a new top-level `source/lib/client/` folder,
move the matching specs alongside their sources, and update every import that
references the old flat paths. Pure structural refactor, no behavior change.

See [engine.md](engine.md) for the full plan.
