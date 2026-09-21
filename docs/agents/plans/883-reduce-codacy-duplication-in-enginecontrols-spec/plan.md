# Plan: Reduce Codacy duplication in EngineControls spec

Issue: [883-reduce-codacy-duplication-in-enginecontrols-spec.md](../../issues/883-reduce-codacy-duplication-in-enginecontrols-spec.md)

## Overview
Table-drive `frontend/spec/components/EngineControls_spec.js` so the per-state `describe` / `beforeEach` / per-button `it` blocks are generated from a map instead of being copied, lowering Codacy's duplication count for the file without changing what the spec verifies.

See [frontend.md](frontend.md) for the full plan.
