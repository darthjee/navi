# Bump the app version

`source/lib` changes, so the release's cascade-bump check requires a new app version. Bump navi-hey from 1.14.5 to 1.14.6 with the repo script, which updates `source/package.json`, the `source/README.md` badges and the root `README.md` Versions table together:

```bash
scripts/bump_version.sh 1.14.6
```

If it refuses because a package is stale (it shouldn't be: deku-swarm 1.16.0 was bumped by #1010 and is untouched here), investigate rather than passing `--force`. Then run `scripts/ci.sh cascade-bump-check` to confirm.

## Files to Change
- `source/package.json`: version 1.14.5 → 1.14.6.
- `source/README.md`: version badges 1.14.5 → 1.14.6.
- `README.md`: Navi-Hey row of the Versions table, updated by the script.
