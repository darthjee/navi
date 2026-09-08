# Split exceptions/config

`source/lib/exceptions/config/` has 19 flat `.js` files. Break into four sub-domain folders,
leaving the three generic "missing config key" errors flat.

- `emit/` — `InvalidEmitBodyTemplate.js`, `InvalidEmitCooldown.js`, `InvalidEmitHeaders.js`,
  `InvalidEmitMethod.js`, `InvalidEmitRetries.js`, `MissingEmitUrl.js`
- `parser/` — `InvalidParserMatch.js`, `InvalidParserType.js`, `MissingParserField.js`,
  `MissingParserFields.js`, `MissingParserMatch.js`
- `memory/` — `InvalidMemoryDataStore.js`, `InvalidMemoryThresholds.js`
- `file/` — `ConfigurationFileNotFound.js`, `ConfigurationFileNotProvided.js`,
  `ConfigurationIncludeNotFound.js`
- stay flat — `MissingClientsConfig.js`, `MissingResourceConfig.js`,
  `MissingTopLevelConfgKey.js` (leave the existing "Confg" typo as-is unless a rename is
  trivially contained to this commit)

Largest resulting flat listing in `exceptions/config/`: 3 files + 4 folders (was 19).

## What to do

1. Create the four subfolders under `source/lib/exceptions/config/` and move the files in.
2. Each moved file extends `AppError` (directly or via an intermediate) — its own import of
   the base/intermediate class gains one `../`. Fix those.
3. Repoint importers. Confirmed call sites (verify with
   `git grep -n "exceptions/config/" source/lib source/spec`):
   - `source/lib/`: `models/configs/MemoryConfig.js`, `models/request/ResourceRequestEmit.js`,
     `models/request/ResourceRequestParser.js`, `parsers/CssSelectorParser.js`,
     `parsers/JsonPathParser.js`, `parsers/json_path/MatchResolver.js`,
     `parsers/regex_parser/AttributesValidator.js`,
     `services/application/ApplicationConfigurator.js`, `services/config/ConfigIncluder.js`,
     `services/config/ConfigParser.js`
   - `source/spec/`: `lib/models/configs/MemoryConfig_spec.js`,
     `lib/models/request/ResourceRequestEmit_spec.js`,
     `lib/models/request/ResourceRequestParser_spec.js`,
     `lib/parsers/CssSelectorParser_spec.js`, `lib/parsers/JsonPathParser_spec.js`,
     `lib/parsers/RegexParser_spec.js`, `lib/parsers/json_path/MatchResolver_spec.js`,
     `lib/parsers/regex_parser/AttributesValidator_spec.js`,
     `lib/services/application/ApplicationConfigurator_spec.js`,
     `lib/services/application/Application_spec.js`,
     `lib/services/builders/NamespaceMapBuilder_spec.js`,
     `lib/services/config/ConfigIncluder_spec.js`, `lib/services/config/ConfigLoader_spec.js`,
     `lib/services/config/ConfigParser_spec.js`
4. Mirror the spec tree: create `emit/`, `parser/`, `memory/`, `file/` under
   `source/spec/lib/exceptions/config/` and move the 6 spec files that exist
   (`ConfigurationIncludeNotFound_spec.js` → `file/`; `InvalidEmitCooldown_spec.js`,
   `InvalidEmitHeaders_spec.js`, `InvalidEmitRetries_spec.js` → `emit/`;
   `InvalidMemoryDataStore_spec.js`, `InvalidMemoryThresholds_spec.js` → `memory/`), fixing
   their `../` depth (+1).
5. Update `docs/agents/architecture/source-layout.md` — the `exceptions/` section lists
   `exceptions/config/` contents in one bullet and in the inheritance tree annotations;
   restructure that bullet into the four sub-groups + the flat trio.
6. Validate: `npm test`, `npm run lint`, `npm run check_docs` clean;
   `git grep -n "exceptions/config/" source/lib source/spec` returns only updated paths.

Commit: `refactor(exceptions): split exceptions/config into emit/parser/memory/file`.

## Files to Change

- `source/lib/exceptions/config/*.js` — 16 of 19 **moved** into `emit/`, `parser/`, `memory/`,
  `file/`; own base-class imports fixed
- `source/spec/lib/exceptions/config/*_spec.js` — 6 existing specs **moved** into mirrored
  subfolders, relative imports fixed
- 10 `source/lib/` importers + 14 `source/spec/` importers listed above — import paths updated
- `docs/agents/architecture/source-layout.md` — `exceptions/config/` bullet restructured
