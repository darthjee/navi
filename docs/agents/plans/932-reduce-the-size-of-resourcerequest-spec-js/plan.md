# Plan: Reduce the size of ResourceRequest_spec.js

Issue: [932-reduce-the-size-of-resourcerequest-spec-js.md](../../issues/932-reduce-the-size-of-resourcerequest-spec-js.md)

## Overview
Split the 698-line `ResourceRequest_spec.js` into four `ResourceRequest_<topic>_spec.js` siblings, each under 300 lines, and move the two local helpers (`setupJobRegistrySpy`, `buildResponseWrapper`) into a shared support util. Pure spec refactor inside `source/` — no production code changes.

See [engine.md](engine.md) for the full plan.
