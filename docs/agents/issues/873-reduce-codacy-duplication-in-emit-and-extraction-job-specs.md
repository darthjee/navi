# Issue: Reduce Codacy duplication in emit and extraction job specs

## Description
Codacy reports 18% code duplication for the repository (the project goal is 10%). This issue tackles the job specs for emission and extraction, which repeat the same job construction and expectation setup.

## Problem
Figures below come from Codacy's analysis of `main` at `f25bf98` and are a baseline only — the files have since grown (e.g. `EmitJob_spec.js` is now 580 lines), so re-check Codacy after the change rather than comparing against these numbers line by line.

| File | Lines | Clones | Duplicated lines |
| --- | ---: | ---: | ---: |
| `source/spec/lib/jobs/EmitJob_spec.js` | 455 | 23 | 175 |
| `source/spec/lib/jobs/ExtractionEmitFlow_spec.js` | 397 | 17 | 176 |
| `source/spec/lib/jobs/ExtractionJob_spec.js` | 268 | 14 | 121 |
| `source/spec/lib/jobs/HtmlParseJob_spec.js` | 182 | 8 | 62 |

- `EmitJob_spec.js` and `ExtractionEmitFlow_spec.js` are the largest offenders; `ExtractionJob_spec.js` and `HtmlParseJob_spec.js` repeat the same job/registry/response setup (e.g. `new ExtractionJob({ id: 'test-id', rawBody, parser, parserRegistry })` inline in most tests, since neither job has a factory yet)

## Expected Behavior
Codacy reports markedly fewer duplication clones for the files above (verified manually by the issue owner after the change), and behaviour is unchanged: the affected specs still pass and still verify the same scenarios.

## Solution
- Extract job construction into factories under `source/spec/support/factories/` — reuse `EmitJobFactory`, and add new `ExtractionJobFactory` and `HtmlParseJobFactory` (neither job has one today)
- Extract registry/response fixtures, scenario and expectation helpers into `source/spec/support/utils/`, following the `JobRegistryScenarios.js` / `CssSelectorHtmlFixtures.js` precedent from #871 and #872
- Parameterise scenarios that differ only by input/expectation
- Keep every existing assertion and scenario: the refactor must not reduce what the specs verify or change any production code
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read

## Benefits
- Lowers the repository duplication percentage reported by Codacy
- Makes the affected files shorter and easier to extend, so new scenarios need one line instead of a copied block
