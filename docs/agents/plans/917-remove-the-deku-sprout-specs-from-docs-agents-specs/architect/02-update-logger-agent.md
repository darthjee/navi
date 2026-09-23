# Update the logger agent definition

`.claude/agents/logger.md` still describes the package as being built:

- Line 9 says "The package is being built up in stages (see the `deku-sprout` specs …) … the layout below is the planned one, not yet on disk". Remove that paragraph.
- `## Commands` says "Once the package is scaffolded (this tooling does not exist yet)". Remove the caveat.
- `## Conventions` links to the specs and says "the permanent `docs/agents/logger.md` lands once the extraction is done". Point it at [Logger Subsystem](../../docs/agents/logger.md) instead.
- The versioning bullet says `scripts/bump_version.sh logger [version]` and that "the script does not know the `logger` target yet". Change it to `scripts/bump_version.sh deku-sprout [version]` and remove the caveat.

Check the spec file names in the Commands examples (e.g. `spec/BaseLogger_spec.js`) against `logger/spec/`, and keep the `yarn` commands consistent with `logger/package.json`'s scripts.

## Files to Change
- `.claude/agents/logger.md`: remove the staged-build wording, fix the links, and correct the bump target
