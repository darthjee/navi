# Git helpers and base-ref resolution

Add a thin git layer, injectable for specs (pass a `runGit(args)` function returning stdout or throwing; default implementation uses `child_process.execFileSync('git', args, { cwd: rootDir })`).

- `lib/git.js`:
  - `readVersionAt(runGit, ref, folder)`: `git show <ref>:<folder>/package.json`, parse JSON, return `version`, or `undefined` when the file does not exist at that ref.
  - `resolveBaseRef(runGit, env)`:
    - `env.CIRCLE_TAG` set → `git describe --tags --abbrev=0 --match='[0-9]*.[0-9]*.[0-9]*' HEAD^` (same pattern as `scripts/lib/package_bump_check.sh`); `undefined` when it fails.
    - `env.CIRCLE_BRANCH === 'main'` → `HEAD^`.
    - otherwise → `git merge-base HEAD origin/main`; `undefined` when it fails.
  - An explicit base ref (CLI argument) overrides the resolution — handled in the CLI, step 03.
- `lib/collectVersions.js` (or inside the CLI helper): build the `{ key: version }` map for the npm entries at a ref, using `readVersionAt`. For `HEAD`, reading from the working tree via `packageJsonReader` is also acceptable; use `git show HEAD:` for consistency.
- `spec/git_spec.js`: fake `runGit` covering each `resolveBaseRef` branch (tag with/without previous tag, main, PR branch, merge-base failure) and `readVersionAt` (found, missing file).

## Files to Change
- `scripts/release/lib/git.js` — new git helpers.
- `scripts/release/lib/index.js` — export the helpers.
- `scripts/release/spec/git_spec.js` — new specs.
