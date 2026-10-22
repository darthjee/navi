# CI Flow

[Back to the release spec](../release.md)

## Rules

- On an `X.Y.Z` tag, every release job always runs. Each job waits for the jobs of its dependencies, whether those released or no-oped.
- Every release job also waits for the tests (and the tag/version check), which gate the whole release.
- A release job releases its package when [detection](detection.md) says its version is new, and no-ops otherwise.
- After a package with an extra tag released, a separate job pushes that tag (`sprout-`, `swarm-`, `node_client-`; see [Tags](tags.md#extra-tags)).
- The extra jobs follow their image:
  - `update-description`, `build-and-release-demo`, `build-and-release-demo-app` and `build-and-release-navi-hey-test` act only when `darthjee/navi-hey` released.
  - `update-description-client` acts only when `darthjee/navi-hey-client` released.
  - They still run otherwise, as no-ops.
- On PR branches only the tests and the cascade-bump test run.
- On any other tag, nothing runs.

## Job graph

```mermaid
flowchart TD
  tests[tests + check-version-tag + cascade-bump test] --> sprout[release deku-sprout]
  tests --> swarm[release deku-swarm]
  sprout --> navi[release navi-hey]
  swarm --> navi
  sprout --> client[release navi-hey-client]
  navi --> navi_img[release darthjee/navi-hey]
  client --> client_img[release darthjee/navi-hey-client]
  navi_img --> desc[update-description]
  navi_img --> demo[build-and-release-demo]
  navi_img --> demo_app[build-and-release-demo-app]
  navi_img --> test_img[build-and-release-navi-hey-test]
  client_img --> desc_client[update-description-client]
  sprout --> tag_sprout[push sprout- tag]
  swarm --> tag_swarm[push swarm- tag]
  client --> tag_client[push node_client- tag]
```

`release navi-hey-client` does not wait for `release deku-swarm`, since the client does not depend on it.
