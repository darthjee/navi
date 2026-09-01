# Emit debug logs in ConfigIncluder

`ConfigIncluder#readYaml` (`source/lib/services/config/ConfigIncluder.js`)
currently resolves a file's content via the static
`EnvStringResolver.resolve(content)` shortcut. Switch it to instantiate
`EnvStringResolver` directly (`const resolver = new
EnvStringResolver(content); const resolved = resolver.resolve();`), then emit
the debug log lines described in the issue from `resolver.matches`, porting
`ConfigFileParser#logInterpolation`
(`clients/node/lib/ConfigFileParser.js`) into a new private
`#logInterpolation(matches, filePath)` method on `ConfigIncluder`:

- Iterate `matches`, counting `resolvedCount`/`missingCount`, and building a
  `Map` keyed by `varName` to dedupe (first occurrence wins — later
  occurrences of the same name in the same file resolve identically, so
  nothing is lost).
- For each deduped entry, call `Logger.debug(\`Config interpolation:
  $${varName}\`, ...)` with `{ path: filePath, defined: true, length, hash }`
  when defined, or `{ path: filePath, defined: false }` when not.
- After the loop, always call `Logger.debug(\`Config interpolation summary:
  ${filePath}\`, { path: filePath, placeholders: matches.length, resolved:
  resolvedCount, missing: missingCount })` — even when `matches` is empty
  (0/0/0), so every file in the chain gets a summary.

Call `this.#logInterpolation(resolver.matches, filePath)` from `#readYaml`
right after resolving, before `YAML.parse`. Since `#readYaml` already runs
once per file for every file in the `include:` chain (the entry file via
`#collect(..., { isEntry: true })` and each included file via
`#resolveIncludes`), this naturally scopes the dedup and summary per file with
no changes needed to `#collect`, `#resolveIncludes`, or any public method.

## Files to Change

- `source/lib/services/config/ConfigIncluder.js` — switch `#readYaml` to an
  instance-based `EnvStringResolver` call and add the `#logInterpolation`
  private method, mirroring `clients/node/lib/ConfigFileParser.js`'s
  `#logInterpolation` field-for-field.
