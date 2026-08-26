# Plan: Crawler: add HTML/CSS selector parser to ParserRegistry

Issue: [700-crawler--add-html-css-selector-parser-to-parserregistry.md](../issues/700-crawler--add-html-css-selector-parser-to-parserregistry.md)

## Overview

Add a third parser type, `css`, to the crawler's `ParserRegistry`, implemented as `CssSelectorParser` in `source/lib/parsers/`. It extracts one output item per matched CSS container element, with a `fields` map (relative sub-selector + optional attribute/array/trim per field) or a `RegexParser`-style single-field fallback, plus an `equals`-only `filter` for excluding containers. Entirely additive — no changes to `RegexParser`, `JsonPathParser`, or the unrelated `HtmlParser`/`HtmlElementParser` asset-discovery utilities.

See [engine.md](engine.md) for the full plan.
