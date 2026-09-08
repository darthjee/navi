# Sub-group common/utils/logging

After step 01, `source/lib/common/utils/logging/` holds 11 flat files. Split off the buffer
trio into a `buffer/` subfolder; leave the loggers and factory flat (they are the primary,
cohesive surface).

- `buffer/` — `BufferedLogger.js`, `LogBuffer.js`, `LogBufferCollection.js`
- stay flat — `Logger.js`, `LoggerGroup.js`, `LogFactory.js`, `Log.js`, `LogContext.js`,
  `LogFilter.js`, `BaseLogger.js`, `ConsoleLogger.js`

If, on inspection, a cleaner cut exists (e.g. `BaseLogger` + `ConsoleLogger` + `LoggerGroup`
into a `loggers/` folder), the planner's grouping is a proposal — apply the grouping that best
matches how the files reference each other, but keep at least one subfolder so the flat
listing shrinks materially.

## What to do

1. Create `source/lib/common/utils/logging/buffer/` and move the three buffer files in.
2. Fix the moved files' own relative imports (they now need one more `../` to reach
   `common/utils/logging/` siblings and `common/` utilities).
3. Repoint every consumer of the moved files. Known importers of the buffer classes:
   `source/lib/registry/LogRegistryInstance.js` (`BufferedLogger`, `LogBufferCollection`),
   plus the specs `source/spec/lib/common/utils/logging/BufferedLogger_spec.js`,
   `.../LogBuffer_spec.js`, `.../LogBufferCollection_spec.js` (moved here in step 01), and any
   `common/` sibling that imports them. Confirm with
   `git grep -n -E "logging/(BufferedLogger|LogBuffer|LogBufferCollection)" source/lib source/spec`.
4. Mirror in specs: create `source/spec/lib/common/utils/logging/buffer/` and move
   `BufferedLogger_spec.js`, `LogBuffer_spec.js`, `LogBufferCollection_spec.js` into it, fixing
   their `../` depth (+1) for both the impl import and any support-helper imports.
5. Update `docs/agents/architecture/source-layout.md` (`utils/` section) and
   `docs/agents/architecture/testing.md` (mirror tree) to show the new
   `common/utils/logging/buffer/` folder.
6. Validate: `npm test`, `npm run lint`, `npm run check_docs` clean; `git grep` shows no
   remaining flat-path references to the moved files.

Commit: `refactor(logging): group buffer classes under common/utils/logging/buffer`.

## Files to Change

- `source/lib/common/utils/logging/BufferedLogger.js`, `LogBuffer.js`,
  `LogBufferCollection.js` — **moved** into `buffer/`, own relative imports fixed
- `source/spec/lib/common/utils/logging/BufferedLogger_spec.js`, `LogBuffer_spec.js`,
  `LogBufferCollection_spec.js` — **moved** into `buffer/`, relative imports fixed
- `source/lib/registry/LogRegistryInstance.js` — `BufferedLogger` / `LogBufferCollection`
  import paths updated to `common/utils/logging/buffer/`
- any other confirmed importer from the `git grep` in step 3
- `docs/agents/architecture/source-layout.md`, `docs/agents/architecture/testing.md` — add the
  `buffer/` folder to the layout and mirror descriptions
