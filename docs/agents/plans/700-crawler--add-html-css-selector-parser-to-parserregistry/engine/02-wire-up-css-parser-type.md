# Wire up the css parser type

Register the new parser and let the config layer accept it.

1. **`source/lib/services/ApplicationInstance.js`** — import `CssSelectorParser` from `../parsers/CssSelectorParser.js` alongside the existing `JsonPathParser`/`RegexParser` imports (around line 15-16), and add it to the `ParserRegistry` construction at line 333: `new ParserRegistry({ regex: new RegexParser(), json_path: new JsonPathParser(), css: new CssSelectorParser() })`.
2. **`source/lib/models/request/ResourceRequestParser.js`** — add `'css'` to the `PARSER_TYPES` const (currently `['regex', 'json_path']`).
3. **`source/lib/exceptions/config/InvalidParserType.js`** — update the hardcoded message and JSDoc to list all three types (`"regex", "json_path", "css"`).

## Files to Change

- `source/lib/services/ApplicationInstance.js` — import and register `CssSelectorParser` under key `css`.
- `source/lib/models/request/ResourceRequestParser.js` — add `css` to `PARSER_TYPES`.
- `source/lib/exceptions/config/InvalidParserType.js` — update message/JSDoc to include `css`.
