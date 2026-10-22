# Tags

[Back to the release spec](../release.md)

## Trigger tags

- **Only `X.Y.Z` triggers CI on a tag.** `X.Y.Z` is still the `navi-hey` version: it must match the `version` in `source/package.json`, as `scripts/check_tag_version.sh` checks today.
- **Every other tag triggers nothing**, not even tests. This covers the old `client-…`, `worker-…` and `deku-sprout-…` tags and the new extra tags below.
- **PR branches run tests only**, never release jobs.
- **Tests still run on the `X.Y.Z` tag** and gate every release job.

A release that only changes another package (for example only `logger/`) still needs a `navi-hey` bump to get an `X.Y.Z` tag. In practice the cascade-bump test already forces this for `deku-sprout` and `deku-swarm`, since `navi-hey` depends on both (see [Detection](detection.md#cascade-bump-test)). A client-only release also needs a `navi-hey` bump, only to produce the tag.

## Extra tags

After a package is released, CI pushes an extra GitHub tag for it, in a separate job (see [CI Flow](ci-flow.md)):

| Package | Extra tag |
|---|---|
| `deku-sprout` | `sprout-<logger version>` |
| `deku-swarm` | `swarm-<worker version>` |
| `navi-hey-client` | `node_client-<client version>` |

`navi-hey` has no extra tag: its release tag is the `X.Y.Z` tag itself. The Docker images get no tag.

## Historical tags

The existing `deku-sprout-<v>`, `worker-<v>` and `client-<v>` tags stay in the repository as history only. Nothing creates new ones, and CI ignores them.
