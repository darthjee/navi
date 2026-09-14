# Issue: Constructors with too many parameters in ResourceRequest / ResourceRequestEmit

## Description
Codacy/Lizard flags two constructors as exceeding the parameter-count threshold (limit 8), along with the test factories that mirror their shape:

- `source/lib/models/request/resource_request/ResourceRequest.js:45` — constructor flagged with **12** parameters
- `source/lib/models/request/resource_request/ResourceRequestEmit.js:64` — constructor flagged with **10** parameters
- `source/spec/support/factories/ResourceRequestFactory.js:21` — `build` flagged with 9 parameters
- `source/spec/support/factories/ResourceRequestEmitFactory.js:22` — `build` flagged with 10 parameters

_Found via Codacy/Lizard complexity analysis (pattern `Lizard_parameter-count-medium`)._

## Problem
Investigation shows all four flagged functions already take a **single destructured options object** (e.g. `constructor({ url, status, clientName, ... })`), not a long list of positional parameters — the exact pattern Lizard's parameter-count check exists to catch. Lizard appears to count each destructured property as a separate "parameter", producing a false positive against this already-idiomatic JS pattern. No further constructor/factory signature refactor is warranted.

Separately, `source/spec/support/factories/` is listed under `excluded_paths` in `.codacy.yaml` (since #71), yet both factories were still flagged — the exclusion isn't being honored for the Lizard tool (or the check ran before it applied), so the factories are getting flagged for something a repo-level config decision already says should be skipped.

## Solution
1. Suppress the `Lizard_parameter-count-medium` false positive on `ResourceRequest.js` and `ResourceRequestEmit.js` — no constructor code change. Use a Codacy pattern-level exclusion (scoped to these files, or to the pattern generally if destructured-object constructors are a recurring case elsewhere) rather than restructuring already-idiomatic code.
2. Investigate and fix why `source/spec/support/factories/` is not actually being excluded from Lizard analysis despite `.codacy.yaml`'s `excluded_paths` entry, so `ResourceRequestFactory.js` and `ResourceRequestEmitFactory.js` stop being flagged too.

## Benefits
- Removes noise from static analysis without churning already-correct constructor signatures.
- Closes a gap where `.codacy.yaml`'s `excluded_paths` isn't actually being respected for spec/support files.
