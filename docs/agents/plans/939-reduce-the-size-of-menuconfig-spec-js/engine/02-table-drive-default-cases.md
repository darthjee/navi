# Table-drive the default-entries cases
In `MenuConfig_spec.js`, collapse the six `.fromFile` scenarios that all expect `[LOGS, MEMORY]` into one example table iterated with `forEach`. Each row has a description and a way to get the path:

- the file does not exist (`join(dir, 'missing.yml')`)
- the file is empty (`''`)
- the file is whitespace-only (`'   \n  \n'`)
- the file is fully commented out (`['# entries:', '#   - route: /dashboard']`)
- the document carries neither entries nor defaults (`'other: value\n'`)
- entries is an explicit empty list (`'entries: []\n'`)

Each row generates `describe(\`when ${description}\`)` with `it('returns the default entries')`, so the spec output stays readable. The missing-file row can't write a file, so give it a path builder, e.g. `path: (dir) => ...`, or a `null` content that the loop turns into the missing path.

## Files to Change
- `source/spec/lib/models/configs/MenuConfig_spec.js` — replace the six near-identical blocks with one table-driven block
