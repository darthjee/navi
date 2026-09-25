# Extract MenuConfigFileUtils
Create `source/spec/support/utils/MenuConfigFileUtils.js`, a static-class helper with JSDoc in the style of `LoggerUtils`/`FixturesUtils`. It replaces the spec's inline temp-file plumbing:

- `createTempDir()` wraps `mkdtempSync(join(tmpdir(), 'menu-config-'))`.
- `removeTempDir(dir)` wraps `rmSync(dir, { recursive: true, force: true })`.
- `write(dir, lines)` accepts a string or an array of lines (joined with `\n`), writes `<dir>/menu.yml`, and returns the path.
- `rendered(path)` returns `MenuConfig.fromFile(path).map((entry) => entry.toJSON())`.
- Static `LOGS`/`MEMORY` expected-entry constants, or a `DEFAULTS` pair, so both spec files share them.

The helper does the file I/O, so it needs the same `security/detect-non-literal-fs-filename` handling `FixturesUtils` uses: an eslint-disable comment with the invariant explained. The path always comes from a temp dir the spec created.

Update `MenuConfig_spec.js` to use it: keep the `beforeEach`/`afterEach` that create and remove `dir`, drop the `node:fs`/`node:os`/`node:path` imports it no longer needs (keep `join` if the missing-file case still uses it), and replace the local `write`/`rendered`/constants.

## Files to Change
- `source/spec/support/utils/MenuConfigFileUtils.js` — new helper (temp dir lifecycle, YAML write, rendered entries, expected constants)
- `source/spec/lib/models/configs/MenuConfig_spec.js` — use the helper instead of local plumbing
