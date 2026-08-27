# Plan: Refactor RegexParser

Issue: [713-refactor-regexparser.md](../issues/713-refactor-regexparser.md)

## Overview
Extract `RegexParser`'s three bundled concerns (attribute validation, pattern matching, value extraction) into dedicated classes under `source/lib/parsers/regex_parser/`, following the class-per-concern pattern from #711/#712 — no public API change.

See [engine.md](engine.md) for the full plan.
