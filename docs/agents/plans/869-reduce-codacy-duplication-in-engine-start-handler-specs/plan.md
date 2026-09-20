# Plan: Reduce Codacy duplication in engine start handler specs

Issue: [869-reduce-codacy-duplication-in-engine-start-handler-specs.md](../../issues/869-reduce-codacy-duplication-in-engine-start-handler-specs.md)

## Overview
Remove the duplication Codacy reports in `ApiEngineStartHandler_spec.js` and `EngineStartHandler_spec.js` by adding two shared spec helpers and parameterising the repeated malformed-`targets` scenarios. Spec-only change: no production code is touched and no scenario or assertion is dropped.

See [engine.md](engine.md) for the full plan.
