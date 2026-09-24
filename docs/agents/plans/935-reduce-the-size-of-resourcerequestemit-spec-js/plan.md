# Plan: Reduce the size of ResourceRequestEmit_spec.js

Issue: [935-reduce-the-size-of-resourcerequestemit-spec-js.md](../../issues/935-reduce-the-size-of-resourcerequestemit-spec-js.md)

## Overview
Bring `ResourceRequestEmit_spec.js` (457 lines) under the 300-line spec size limit, without losing coverage. The repeated constructor validation cases become example tables, and `#resolveBody` moves to its own spec file. All the work is in `source/spec/`, which the engine agent owns.

See [engine.md](engine.md) for the full plan.
