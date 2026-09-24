# Plan: Reduce the size of EngineController_spec.js

Issue: [934-reduce-the-size-of-enginecontroller-spec-js.md](../../issues/934-reduce-the-size-of-enginecontroller-spec-js.md)

## Overview
Split `source/spec/lib/services/engine/EngineController_spec.js` (569 lines) into three spec files, each under 300 lines. The fake engine, the shared lifecycle scenarios and the common controller setup move into `source/spec/support/`. This is a test-only refactor owned by the `engine` agent.

See [engine.md](engine.md) for the full plan.
