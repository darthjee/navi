# Plan: Reduce the size of ExtractionJob_spec.js

Issue: [942-reduce-the-size-of-extractionjob-spec-js.md](../../issues/942-reduce-the-size-of-extractionjob-spec-js.md)

## Overview
Split `source/spec/lib/jobs/ExtractionJob_spec.js` (312 lines) by moving the `emission tracking` and `extraction tracking` blocks into a new `ExtractionJobTracking_spec.js`, with the shared setup extracted into `source/spec/support/utils/ExtractionJobSpecUtils.js`.

See [engine.md](engine.md) for the full plan.
