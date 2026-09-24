# Plan: Reduce the size of ExtractionEmitFlow_spec.js

Issue: [936-reduce-the-size-of-extractionemitflow-spec-js.md](../../issues/936-reduce-the-size-of-extractionemitflow-spec-js.md)

## Overview
Split the 422-line `source/spec/lib/jobs/ExtractionEmitFlow_spec.js` into two end-to-end specs (one per top-level `describe`) and move the setup/helpers they share into a new `EndToEndFlowUtils` support util, so every resulting file is under 300 lines with no coverage lost.

See [engine.md](engine.md) for the full plan.
