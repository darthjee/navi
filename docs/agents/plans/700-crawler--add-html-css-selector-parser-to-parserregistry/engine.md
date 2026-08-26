# Engine Plan: Crawler: add HTML/CSS selector parser to ParserRegistry

Main plan: [plan.md](plan.md)

## Overview

Implement `CssSelectorParser`, register it under the `css` key alongside `regex`/`json_path`, and validate the new type in `ResourceRequestParser`, following the `Parser` interface (`extract(rawBody, attributes) → Array`) already established by `RegexParser`/`JsonPathParser`.

## Context

- `RegexParser` (`source/lib/parsers/RegexParser.js`) and `JsonPathParser` (`source/lib/parsers/JsonPathParser.js`) are the two existing parser implementations; `ParserRegistry` (`source/lib/registry/ParserRegistry.js`) is a plain `NamedRegistry` mapping `parser.type` to an implementation instance, wired up in `ApplicationInstance.js:333-334`.
- `ExtractionJob#perform` (`source/lib/jobs/ExtractionJob.js`) calls `parserImpl.extract(rawBody, attributes)` with **no `logContext`** — this rules out reusing `HtmlElementParser#getAttribute` (`source/lib/utils/HtmlElementParser.js`), which requires one to log warnings. Only the `node-html-parser` npm dependency itself (already in `source/package.json`, used by `source/lib/utils/HtmlParser.js`) is shared — no new dependency, no shared code with the asset-discovery utilities.
- `ResourceRequestParser` (`source/lib/models/request/ResourceRequestParser.js`) validates `parser.type` against a `PARSER_TYPES` const and throws `InvalidParserType` (`source/lib/exceptions/config/InvalidParserType.js`) otherwise; both need `css` added.
- Full config shape, edge cases, and worked examples are in the issue file linked above — this plan does not repeat them in full, only what's needed to implement.
- No new exception classes are needed: `MissingParserMatch`, `MissingParserField`, and `InvalidHtmlResponseBody` (`source/lib/exceptions/request/InvalidHtmlResponseBody.js`) already exist and cover every error case this parser needs.

## Steps

- [01 — Implement CssSelectorParser](engine/01-implement-css-selector-parser.md)
- [02 — Wire up the css parser type](engine/02-wire-up-css-parser-type.md)
- [03 — Add test coverage](engine/03-add-test-coverage.md)

## CI Checks

- `source`: `npm run coverage` (CI job: `jasmine`)
- `source`: `npm run lint` (CI job: `checks`)

## Notes

- `#707` (sub-issue of #700) defers `json_path`-style `equals_field` support in `filter` to a follow-up — do not implement it here, only literal `equals`.
- Text extraction uses `node-html-parser`'s `HTMLElement#text` getter (unescaped text content) — confirmed present in `node-html-parser@7.1.0`'s type declarations.
