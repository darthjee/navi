# Plan: Refactor: split oversized flat directories under source/lib/

Issue: [812-refactor-split-oversized-flat-directories-under-source-lib.md](../../issues/812-refactor-split-oversized-flat-directories-under-source-lib.md)

## Overview

Pure structural refactor confined to `source/lib/**` and `source/spec/lib/**`: remove the
dead `source/lib/utils/logging/` re-export barrel, then break five oversized leaf directories
into sub-domain folders following the repo's existing convention (snake_case subfolder + a few
cohesive peer files left flat, as in `parsers/css_selector_parser/`, `server/handlers/engine/`,
`services/config/`). Every import/export/jsdoc path is edited at the call site — no path alias,
no compatibility shims. The `source/spec/lib/**` tree moves in lockstep, one commit per
directory.

See [engine.md](engine.md) for the full plan.
