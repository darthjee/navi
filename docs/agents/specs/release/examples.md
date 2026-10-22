# Examples

[Back to the release spec](../release.md)

## `1.15.1` from `1.15.0`

Scenario:

- no changes in `logger/`;
- changes in `worker/` (with a `deku-swarm` bump);
- changes in `source/` (with a `navi-hey` bump to `1.15.1`);
- no changes in `clients/node/`.

On tag `1.15.1`:

| Job | Waits for | Outcome |
|---|---|---|
| release `deku-sprout` | tests | no-op (version already on npm) |
| release `deku-swarm` | tests | releases to npm; pushes `swarm-<v>` |
| release `navi-hey` | `deku-sprout`, `deku-swarm` | releases `1.15.1` to npm |
| release `darthjee/navi-hey` | `navi-hey` | releases `1.15.1` to Docker Hub; the description, demo, demo-app and navi-hey-test jobs act |
| release `navi-hey-client` | `deku-sprout` | no-op |
| release `darthjee/navi-hey-client` | `navi-hey-client` | no-op; `update-description-client` no-ops |

This corrects #977, where `navi-hey-client` also waits for `deku-swarm`.

## Logger-only release

Scenario: only `logger/` changed, with a `deku-sprout` bump. The cascade-bump test then requires a `navi-hey` bump (which also yields the `X.Y.Z` tag) and a `navi-hey-client` bump.

On the new `X.Y.Z` tag:

| Job | Outcome |
|---|---|
| release `deku-sprout` | releases to npm; pushes `sprout-<v>` |
| release `deku-swarm` | no-op |
| release `navi-hey` | releases `X.Y.Z` to npm |
| release `darthjee/navi-hey` | releases to Docker Hub; its extra jobs act |
| release `navi-hey-client` | releases to npm; pushes `node_client-<v>` |
| release `darthjee/navi-hey-client` | releases to Docker Hub; `update-description-client` acts |
