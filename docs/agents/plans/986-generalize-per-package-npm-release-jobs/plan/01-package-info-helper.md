# Add the release.yml package-info helper

Bash can't parse `release.yml` reliably, so add a small node entry point that prints one package's release data as shell-friendly `KEY=value` lines. The script in step 02 consumes them.

- Add `describePackage(tree, name)` in `scripts/release/lib/describePackage.js`, exported from `lib/index.js`. It returns `{ name, folder, platform, tagPrefix, dependsOn }` from the tree loaded by `loadReleaseTree`, and throws when `name` is not in `packages`.
- Add `scripts/release/bin/release-package-info.js <package> [rootDir]`, registered in `package.json` `bin`. It prints:
  ```
  FOLDER=logger
  PLATFORM=npm
  TAG_PREFIX=sprout-
  DEPENDS_ON=deku-sprout deku-swarm
  ```
  `TAG_PREFIX` and `DEPENDS_ON` are empty when absent. An unknown package or a missing argument goes to stderr and exits 1.
- Specs: `spec/describePackage_spec.js` covers a package with and without `tag_prefix` / `depends_on` and an unknown package. Extend `index_spec.js` with the new export. Keep the coverage and lint conventions of the existing specs.

## Files to Change
- `scripts/release/lib/describePackage.js` — new pure function.
- `scripts/release/lib/index.js` — export it.
- `scripts/release/bin/release-package-info.js` — new CLI printing `KEY=value`.
- `scripts/release/package.json` — add the `bin` entry; update `description`.
- `scripts/release/spec/describePackage_spec.js` — new spec.
- `scripts/release/spec/index_spec.js` — cover the new export.
- `scripts/release/README.md` — document the new CLI.
