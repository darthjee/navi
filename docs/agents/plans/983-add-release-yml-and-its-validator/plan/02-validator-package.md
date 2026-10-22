# Create the `scripts/release/` validator package
Create a small private ESM package at `scripts/release/`, laid out like `logger/`:

- **`package.json`**:
  - `"name": "navi-release-scripts"`, `"private": true`, `"type": "module"`;
  - `dependencies`: `yaml` (`^2.8.2`, the version `source/` uses);
  - `devDependencies`: the same jasmine, c8, eslint and jscpd set as `logger/package.json`;
  - `scripts`: the same `spec`, `test`, `coverage`, `lint`, `lint_fix`, `lint_report` and `report` entries as `logger/`.
- **`yarn.lock`**: generated with `yarn install`, so the frozen install works in CI.
- **`eslint.config.mjs`, `spec/support/jasmine.json`, `.gitignore`**: copied from `logger/` and adjusted to this package.

## Library: `lib/`

- **`lib/loadReleaseTree.js`**:
  - reads and parses `release.yml` from a given root dir with `yaml`;
  - returns `{ packages: { <key>: { folder, platform, dependsOn, tagPrefix } } }`;
  - throws a clear error if the `packages` map is missing.
- **`lib/validateReleaseTree.js`**: a pure function `validateReleaseTree(tree, readPackageJson)` that returns an array of error strings, empty when valid. `readPackageJson(folder)` returns the parsed object, or `null` when the folder or its `package.json` is missing. The function is pure so specs can pass in fixtures. The checks:
  1. **Folder and name.** `readPackageJson(folder)` is not `null` (error: `<key>: folder '<folder>' has no package.json`). For `npm` entries, `pkg.name === key` (error: `<key>: package.json name is '<name>'`).
  2. **npm `depends_on` vs `package.json`.**
     - Local deps are the names in `pkg.dependencies` and `pkg.peerDependencies` that are also `npm` keys of the tree. `devDependencies` are ignored.
     - Report every local dep missing from `depends_on` (`<key>: declares <dep> but depends_on does not list it`).
     - Report every `depends_on` entry missing from the declared deps (`<key>: depends_on lists <dep> but package.json does not declare it`).
  3. **Docker entries.** `depends_on` must equal exactly `[<the npm key whose folder is the same>]`. Report an error if there is no npm entry in that folder, or if the list differs.
- **`lib/index.js`**: re-exports both functions.

## CLI

**`bin/validate-release-yml.js`** takes the repo root as argument 1, defaulting to `../..` from the script. It loads the tree and validates it with a `readPackageJson` that reads `<root>/<folder>/package.json` from disk.
- On errors, it prints each one to stderr and exits 1.
- Otherwise it prints `release.yml OK (<n> packages)` and exits 0.

## Specs

`spec/validateReleaseTree_spec.js` uses in-memory fixture trees and a `readPackageJson` stub. It covers:
- the happy path (a copy of the real tree);
- a dependency declared but not listed;
- an extra `depends_on` entry;
- a missing folder;
- an npm name mismatch;
- a docker entry depending on the wrong package;
- a docker entry with no npm sibling;
- `devDependencies` being ignored;
- a dependency declared as `^x.y.z` (not `file:`) still counting.

`spec/loadReleaseTree_spec.js` uses a temp-dir fixture and covers parsing and the missing-`packages` error.

Also add one spec that runs the validator against the real repo root, so a drift is caught by the jasmine job too.

## Files to Change
- `scripts/release/package.json`, `scripts/release/yarn.lock` — new package.
- `scripts/release/eslint.config.mjs`, `scripts/release/.gitignore`, `scripts/release/spec/support/jasmine.json` — tooling, copied from `logger/`.
- `scripts/release/lib/loadReleaseTree.js`, `scripts/release/lib/validateReleaseTree.js`, `scripts/release/lib/index.js` — validator logic.
- `scripts/release/bin/validate-release-yml.js` — CLI entrypoint.
- `scripts/release/spec/loadReleaseTree_spec.js`, `scripts/release/spec/validateReleaseTree_spec.js` — specs.
