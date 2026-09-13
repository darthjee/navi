# Issue: Upgrade form-data (4.0.5) — CRLF field-override CVE

## Description
Codacy/Trivy's dependency scan (`Trivy_vulnerability_high`) flagged `form-data@4.0.5` for CVE-2026-12143 — a CRLF injection vulnerability that lets an attacker override multipart form field names/values when untrusted input reaches a form-data field.

`source` and `clients/node` already resolve to the patched `form-data@4.0.6` (pulled in transitively via the recent axios upgrade in #836). The vulnerable `4.0.5` still remains in:

- `frontend/package-lock.json` and `frontend/yarn.lock` — transitive via `jsdom` (dev dependency, test-only)
- `dev/app/yarn.lock` — transitive (dev dependency)
- `dev/frontend/yarn.lock` — transitive via `jsdom` (dev dependency)

No `package.json` in the repo depends on `form-data` directly; all occurrences are transitive.

## Problem
An outdated, vulnerable version of a transitive dependency remains locked in three package manager lockfiles, leaving the CVE flagged by dependency scanning unresolved for those packages even though it has already been fixed elsewhere in the monorepo.

## Solution
Force resolution of `form-data` to `>=4.0.6` in the affected packages and re-lock both npm and yarn lockfiles:

- `frontend`: `package-lock.json` and `yarn.lock`
- `dev/app`: `yarn.lock`
- `dev/frontend`: `yarn.lock`

Since `form-data` is not a direct dependency anywhere, this likely means adding/updating an `overrides` (npm) / `resolutions` (yarn) entry in each affected `package.json`, then regenerating the lockfiles.

## Benefits
Closes CVE-2026-12143 across the whole monorepo, keeping dependency scanning clean and preventing CRLF-based form field override in any transitive consumer of `form-data`.
