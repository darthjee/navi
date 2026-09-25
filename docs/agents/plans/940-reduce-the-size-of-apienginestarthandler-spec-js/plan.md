# Plan: Reduce the size of ApiEngineStartHandler_spec.js

Issue: [940-reduce-the-size-of-apienginestarthandler-spec-js.md](../../issues/940-reduce-the-size-of-apienginestarthandler-spec-js.md)

## Overview
Split `source/spec/lib/server/handlers/api/ApiEngineStartHandler_spec.js` (314 lines) so every resulting spec is under 300 lines. The shared setup moves into a support util, and the `targets` parameters scenarios move into their own spec file. No behavior is dropped.

See [engine.md](engine.md) for the full plan.
