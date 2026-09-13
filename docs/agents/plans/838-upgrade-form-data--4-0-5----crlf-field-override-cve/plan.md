# Plan: Upgrade form-data (4.0.5) — CRLF field-override CVE

Issue: [838-upgrade-form-data--4-0-5----crlf-field-override-cve.md](../../issues/838-upgrade-form-data--4-0-5----crlf-field-override-cve.md)

## Overview

`form-data@4.0.5` (CVE-2026-12143) is still locked as a transitive dependency in `frontend` and in `dev/app`/`dev/frontend`. `source` and `clients/node` already resolve to the patched `4.0.6` via the prior axios upgrade (#836). Since no `package.json` depends on `form-data` directly anywhere, the fix is to pin it via an npm `overrides` / yarn `resolutions` entry in each affected package's `package.json`, then regenerate the lockfiles.

## Agents involved

- [frontend](frontend.md)
- [dev](dev.md)

## Shared contracts

None. Both agents apply the same independent, self-contained change (pin `form-data` to `^4.0.6` via override/resolution, regenerate lockfiles) in their own directories — nothing crosses the boundary between them.
