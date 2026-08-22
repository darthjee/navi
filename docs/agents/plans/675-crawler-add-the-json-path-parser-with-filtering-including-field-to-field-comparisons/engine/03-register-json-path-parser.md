# Register json_path in ParserRegistry wiring

Wire the new parser into the same place `regex` is wired, so `ExtractionJob` can resolve `parser.type: json_path` at runtime.

## Files to Change

- `source/lib/services/ApplicationInstance.js` — import `JsonPathParser` and add `json_path: new JsonPathParser()` alongside the existing `regex: new RegexParser()` entry in the `ParserRegistry` construction (around line 331).
