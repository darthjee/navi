# Issue: Oversized test methods (>50 LOC) in several specs

## Description
Codacy/Lizard's complexity scan (pattern `Lizard_nloc-medium`) flags three spec files with test bodies well over the project's 50-line-of-code guideline. Long spec bodies are harder to scan and tend to hide what's actually being asserted.

## Problem
- `source/spec/lib/services/config/ConfigParser_spec.js:23` — the `describe('.fromObject', ...)` block runs 23–247 (~225 raw lines), with a large early segment (~74 flagged lines starting at line 23) covering several unrelated concerns (resource/client mapping, workers config variants, missing-key errors, web/log/emit/extraction/failure sub-configs, namespace propagation, strict mode) inside one flat describe.
- `source/spec/lib/models/request/resource_request/ResourceRequest_spec.js:303` — the `describe('#hasUnresolvedTokens', ...)` block (lines 303–393, ~91 raw lines / ~76 flagged NLOC) is a single large parameterized data-table test.
- `frontend/spec/components/ExtensionRoutes_spec.js:19` — Codacy attributes 86 lines to the `buildExtensionRoutes` helper, but as it stands in the current file that helper is only 10 lines (19–28). This looks like a Lizard/Codacy measurement artifact (likely from brace-matching confusion around the nested `React.createElement`/object-literal calls in this file) rather than a genuine oversized function. It's kept in scope regardless: the enclosing `describe('extension routes integration', ...)` block (lines 54–104, ~51 lines) is itself right at the guideline and can still be tidied up.

## Solution
Split each oversized spec body by concern into smaller, focused nested `describe`/`it` blocks — e.g. one `describe` per sub-config or per related group of parameter cases — following the existing patterns already used elsewhere in the spec suite (such as the `parseFixture`/`buildDefaultResources` helpers already present in `ConfigParser_spec.js`):
- `ConfigParser_spec.js` — break the flat `.fromObject` describe into nested describes per concern (resource/client mapping, workers config variants, missing-key errors, each sub-config, namespace propagation, strict mode).
- `ResourceRequest_spec.js` — split the `#hasUnresolvedTokens` parameterized cases into smaller grouped describes (e.g. by placeholder-satisfied vs. placeholder-missing scenarios).
- `ExtensionRoutes_spec.js` — tidy the `extension routes integration` describe block (e.g. by grouping related `it`s or trimming shared setup into a helper), even though the specific `buildExtensionRoutes` line-count claim doesn't hold up under inspection.

## Benefits
- Each `describe`/`it` block stays scannable and focused on one concern.
- Failures point more precisely at what broke.
- Brings these specs in line with the project's 50-LOC guideline and Codacy/Lizard complexity checks.
