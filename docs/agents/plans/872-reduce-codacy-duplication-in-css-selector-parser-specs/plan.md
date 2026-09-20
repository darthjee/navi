# Plan: Reduce Codacy duplication in CSS selector parser specs

Issue: [872-reduce-codacy-duplication-in-css-selector-parser-specs.md](../../issues/872-reduce-codacy-duplication-in-css-selector-parser-specs.md)

## Overview
Refactor the two CSS selector parser specs (`ConditionMatcher_spec.js`, `CssSelectorParser_spec.js`) to use per-spec fixture helpers and table-driven cases, lowering Codacy duplication without changing any production code or removing any scenario.

See [engine.md](engine.md) for the full plan.
