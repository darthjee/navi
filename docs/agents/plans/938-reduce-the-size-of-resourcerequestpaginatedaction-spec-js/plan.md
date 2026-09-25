# Plan: Reduce the size of ResourceRequestPaginatedAction_spec.js

Issue: [938-reduce-the-size-of-resourcerequestpaginatedaction-spec-js.md](../../issues/938-reduce-the-size-of-resourcerequestpaginatedaction-spec-js.md)

## Overview
Split the 383-line `ResourceRequestPaginatedAction_spec.js` into three spec files, each under 300 lines. Move the `parameters` and `namespace resolution` blocks of `#execute` into their own files. Put the constants and helper they share in a new spec-support util. The change only touches `source/spec/`, so the `engine` agent owns it.

See [engine.md](engine.md) for the full plan.
