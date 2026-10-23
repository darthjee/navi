# 04 — `bump_version.sh` prefixes and README links

- `CHECKED_PACKAGES`: stop hardcoding `worker-` / `deku-sprout-`. Keep the `<target> <folder>` pairs keyed by the `release.yml` package (`worker` → `deku-swarm`, `deku-sprout` → `deku-sprout`) and read each `tag_prefix` through `scripts/lib/release_package_info.sh`. `scripts/release` must have its deps installed locally: install them (non-frozen is fine locally, or reuse `scripts/ci/install-deps.sh`) when `scripts/release/node_modules` is missing.
- README link rewrites (`bump_client`, `bump_worker`, `bump_deku_sprout`): new links use `node_client-`, `swarm-` and `sprout-` (prefix from `release.yml` too, or the same lookup). The `sed` match patterns must accept **both** the old and the new prefix (the current README still links `client-0.2.4`, `worker-1.12.0`, `deku-sprout-0.3.0`), e.g. match `releases/tag/[^)]*` and `compare/[^)]*` inside the specific `**Client …:**` / `**Worker …:**` / `**Deku Sprout …:**` lines.
- The app links (`X.Y.Z`) are unchanged.
- Leave `README.md` itself unchanged in this issue: the next bump rewrites it. (Its current links point to existing historical tags, so they still work.)

## Files to Change

- `scripts/bump_version.sh` — prefix lookup and README `sed` patterns.
