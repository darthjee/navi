# Plan: Crawler: add the json_path parser, with filtering including field-to-field comparisons

Issue: [675_crawler-add-the-json-path-parser-with-filtering-including-field-to-field-comparisons.md](../issues/675-crawler-add-the-json-path-parser-with-filtering-including-field-to-field-comparisons.md)

## Overview

Adds the `json_path` parser (the second built-in parser for `ExtractionJob`/`ParserRegistry`, after `regex`), which navigates a dot-notation path into a parsed JSON response body, filters the resulting list of items with AND'ed literal and field-to-field conditions, and maps fields into an output shape.

See [engine.md](engine.md) for the full plan.
