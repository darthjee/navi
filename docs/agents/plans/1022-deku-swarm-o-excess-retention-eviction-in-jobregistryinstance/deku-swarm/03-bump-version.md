# Bump deku-swarm to 1.14.0

`swarm-1.13.0` is already released, and this change adds public API (`IdentifyableCollection#removeOldest`), so bump deku-swarm with a **minor** version. Run from the repo root:

```bash
scripts/bump_version.sh deku-swarm 1.14.0
```

Never edit the version by hand. The script updates `deku-swarm/package.json` and the `deku-swarm` row (Current/Next) of the Versions table in `README.md`.

Cascade: a deku-swarm bump requires a `navi-hey` bump. `source/package.json` is already `1.14.3` (the last `X.Y.Z` tag is `1.14.2`), so the cascade check already passes. Only if `1.14.3` has been released by the time this lands (check `git tag -l '1.14.3'`) also run `scripts/bump_version.sh app` to get the next patch.

## Files to Change
- `deku-swarm/package.json` — version `1.14.0` (through the script).
- `README.md` — deku-swarm Versions row (through the script).
