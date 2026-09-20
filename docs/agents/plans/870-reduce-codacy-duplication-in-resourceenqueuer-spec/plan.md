# Plan: Reduce Codacy duplication in ResourceEnqueuer spec

Issue: [870-reduce-codacy-duplication-in-resourceenqueuer-spec.md](../../issues/870-reduce-codacy-duplication-in-resourceenqueuer-spec.md)

## Overview
Refactor `source/spec/lib/utils/ResourceEnqueuer_spec.js` to cut Codacy duplication, reusing and minimally extending the `NamespaceMapUtils` helper added by #869. Test-only change; no production code is touched.

See [engine.md](engine.md) for the full plan.
