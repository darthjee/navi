# Issue: Upgrade react-router (7.14.2) — DoS and CSRF bypass CVEs

## Description
Codacy/Trivy flags `react-router-dom@7.14.2` (which pulls in `react-router@7.14.2` as a lockstep transitive dependency) for 3 vulnerabilities:

- CVE-2026-42342 — DoS via unbounded path expansion in the `__manifest` endpoint
- CVE-2026-55685 — DoS via unauthenticated manifest endpoint requests
- GHSA-qwww-vcr4-c8h2 — RSC Mode CSRF Bypass allows action execution before a 400 response

_Found via Codacy/Trivy dependency scan (`Trivy_vulnerability_high`)._

## Problem
`react-router-dom` is a direct dependency in `frontend/package.json`, pinned exactly to `7.14.2`. `react-router` is not used directly anywhere in the repo — it is pulled in transitively by `react-router-dom`, which pins its own `react-router` dependency to the exact same version (`7.14.2`) in lockstep. `source/` does not depend on `react-router` or `react-router-dom` at all — confirmed by grep across `source/package.json`, `source/package-lock.json`, and `source/yarn.lock`.

**Locations:**
- `frontend/package.json` (`react-router-dom` direct dependency)
- `frontend/package-lock.json`
- `frontend/yarn.lock`

## Expected Behavior
`react-router-dom` (and the `react-router` it pulls in) is on a version with no known High severity CVEs, and the frontend continues to build and pass its test suite.

## Solution
Bump `react-router-dom` to `7.18.3` (latest, satisfies the fix threshold of `>=7.18.2`) in `frontend/package.json`, then re-lock `frontend/package-lock.json` and `frontend/yarn.lock`. `react-router` cannot be bumped independently since `react-router-dom` pins it exactly — bumping `react-router-dom` is the only way to move `react-router` past the vulnerable range.

## Benefits
Eliminates the DoS and CSRF-bypass CVEs on the frontend without any unrelated dependency churn in `source/`.
