# Cascade check module

Add a pure module computing missing bumps, with no git or file access, so it is fully specced with fixtures.

- `lib/checkCascadeBumps.js` exporting `checkCascadeBumps(tree, baseVersions, headVersions)`:
  - `baseVersions` / `headVersions`: maps from npm key to version string (`undefined`/missing when the package has no `package.json` at that ref).
  - A package is **bumped** when it exists at both refs and the versions differ. Missing at base → not bumped.
  - Build the reverse dependency map from `depends_on` over npm entries only (docker entries are skipped).
  - For each bumped package, walk dependents transitively (guard against revisits); every dependent that is not bumped yields an error such as `navi-hey-client must be bumped because deku-sprout changed 0.3.0 -> 0.4.0`.
  - When a transitive dependent is reached through an intermediate package, name the original bumped package in the message.
  - Deduplicate: one error per (dependent, bumped dependency) pair; return errors sorted for stable output.
- Export it from `lib/index.js`.
- `spec/checkCascadeBumps_spec.js`, reusing the `entry`/`buildTree` fixture shape from `validateReleaseTree_spec.js`:
  - no bumps → no errors;
  - `deku-sprout` bump alone → errors for `navi-hey` and `navi-hey-client`;
  - `deku-sprout` + both dependents bumped → no errors;
  - `deku-swarm` bump alone → error for `navi-hey` only;
  - `navi-hey-client` bump alone → no errors;
  - package missing at base → never triggers;
  - a transitive chain fixture (A → B → C, only A bumped) → errors for B and C;
  - docker entries never appear in errors.

## Files to Change
- `scripts/release/lib/checkCascadeBumps.js` — new pure check.
- `scripts/release/lib/index.js` — export `checkCascadeBumps`.
- `scripts/release/spec/checkCascadeBumps_spec.js` — new specs.
