# Plan: Reduce Codacy duplication in EngineController spec

Issue: [875-reduce-codacy-duplication-in-enginecontroller-spec.md](../../issues/875-reduce-codacy-duplication-in-enginecontroller-spec.md)

## Overview
Spec-only refactor of `source/spec/lib/services/engine/EngineController_spec.js` to remove the duplicated blocks Codacy flags (18 clones), without changing production code or dropping any scenario.

See [engine.md](engine.md) for the full plan.
