# Plan: Oversized test methods (>50 LOC) in several specs

Issue: [844-oversized-test-methods---50-loc--in-several-specs.md](../../issues/844-oversized-test-methods---50-loc--in-several-specs.md)

## Overview

Codacy/Lizard flags three spec files with test bodies over the project's 50-line-of-code guideline. Split each into smaller, focused nested `describe`/`it` blocks by concern, following patterns already used elsewhere in each spec suite. The two backend files (`source/spec/...`) and the one frontend file (`frontend/spec/...`) are independent, non-overlapping refactors with no shared interface between them.

## Agents involved

- [engine](engine.md)
- [frontend](frontend.md)

## Shared contracts

None. Each agent's spec file lives in a separate tree (`source/spec/` vs. `frontend/spec/`), covers unrelated production code, and can be split independently — there is no interface, schema, or fixture shared across the two agents' work.
