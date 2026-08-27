# Plan: Refactor JsonPathParser

Issue: [711-refactor-jsonpathparser.md](../issues/711-refactor-jsonpathparser.md)

## Overview
Extract `JsonPathParser`'s four private helper methods into standalone, individually-testable classes under `source/lib/parsers/json_path/`, with `JsonPathParser#extract` delegating to them.

See [engine.md](engine.md) for the full plan.
