# Plan: CI: npm-publish-client fails on frozen-lockfile install — clients/node/yarn.lock is missing deku-sprout

Issue: [972-ci-npm-publish-client-fails-on-frozen-lockfile-install-clients-node-yarn-lock-is-missing-deku-sprout.md](../../issues/972-ci-npm-publish-client-fails-on-frozen-lockfile-install-clients-node-yarn-lock-is-missing-deku-sprout.md)

## Overview
Fix the stale `clients/node/yarn.lock` (missing `deku-sprout` since #924) by bumping the client's `deku-sprout` range to `^0.3.0` and regenerating the lockfile. Then make the client's PR jobs install with a frozen lockfile so this can't recur silently, and bump the client to `0.2.4` for re-release.

See [navi-client.md](navi-client.md) for the full plan.
