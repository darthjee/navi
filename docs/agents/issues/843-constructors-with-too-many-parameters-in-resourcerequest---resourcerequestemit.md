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

Separately, `source/spec/support/factories/` is listed under `excluded_paths` in `.codacy.yaml` (since #71), yet both factories were still flagged — confirmed via the Codacy API that all 4 issues are currently active (not stale), so the exclusion genuinely isn't being honored for these files.

Also confirmed via the Codacy API: the `Lizard` tool has no repo-side configuration file (`usesConfigurationFile: false`) — pattern-level suppression (disabling `Lizard_parameter-count-medium`, or marking these specific issues as false positives) can only be done from the Codacy dashboard (Project Settings → Code Patterns), not from anything committed to this repo. There is currently no code change or PR that resolves the constructor part of this issue.

## Solution
1. **Manual, outside this repo:** in the Codacy dashboard for `darthjee/navi`, either disable pattern `Lizard_parameter-count-medium` for JavaScript, or mark the 4 specific open issues as false positives:
   - `ResourceRequest.js:45` (constructor, 12 params)
   - `ResourceRequestEmit.js:64` (constructor, 10 params)
   - `ResourceRequestFactory.js:21` (`build`, 9 params)
   - `ResourceRequestEmitFactory.js:22` (`build`, 10 params)
2. Investigate, in the Codacy dashboard's repo settings, why `source/spec/support/factories/` is not actually excluded from Lizard analysis despite `.codacy.yaml`'s `excluded_paths` entry — this may need a matching "ignored files" setting on the dashboard side rather than (or in addition to) `.codacy.yaml`.

## Benefits
- Removes noise from static analysis without churning already-correct constructor signatures.
- Closes a gap where `.codacy.yaml`'s `excluded_paths` isn't actually being respected for spec/support files.

## Notes
- No code change or pull request is expected to close this issue — both steps above are manual actions in the Codacy dashboard by someone with admin access to the `darthjee/navi` Codacy project.
