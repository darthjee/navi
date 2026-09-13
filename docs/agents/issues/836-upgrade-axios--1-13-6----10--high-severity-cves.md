# Issue: Upgrade axios (1.13.6) — 10+ High severity CVEs

## Description
Codacy/Trivy dependency scanning flags `axios@1.13.6` (currently resolved via `^1.13.0` in `source/package.json`, pinned in `source/package-lock.json` and `source/yarn.lock`) as vulnerable to numerous High/Moderate severity CVEs, including prototype-pollution-based request hijacking, header injection, proxy-credential leakage on redirect, NO_PROXY/SSRF bypasses, and ReDoS via crafted cookie names.

_Found via Codacy/Trivy dependency scan (`Trivy_vulnerability_high`)._

## Problem
`axios` is a **direct** dependency of the `source/` workspace only, used exclusively by `source/lib/client/Client.js` to perform outbound GET/POST/PUT/PATCH requests for resource fetching and emit flows. It is not a dependency (direct or transitive) of the `frontend/` workspace — `frontend/package.json`, `frontend/package-lock.json`, and `frontend/yarn.lock` contain no reference to `axios` at all, so the originally reported locations for that workspace do not apply.

Per `npm audit` inside `source/`, the vulnerable range extends further than the issue's original `>=1.16.0` fix target: several Moderate/High advisories (e.g. HTTP/2 streamed uploads bypassing `maxBodyLength`, prototype-pollution gadgets altering request construction, `formDataToJSON` recursion DoS) are only fixed starting in `axios@1.18.0`. The latest published release is `1.20.0`.

## Expected Behavior
`axios` in `source/` is upgraded to a version with no known High/Moderate advisories, the existing `Client.js`-based request/emit flows keep working exactly as before (no behavior change, since the module already avoids proxy/XSRF-cookie configuration), and the repo's test suite passes against the new version.

## Solution
- Bump `axios` in `source/package.json` (or rely on its existing `^1.13.0` caret range) and re-lock `source/package-lock.json` and `source/yarn.lock` to pull `axios@1.20.0` (latest, fully patched) rather than the originally suggested `>=1.16.0` floor, which would still leave several advisories open.
- No changes needed in `frontend/` — it has no `axios` dependency.
- Run the existing `source` test suite (`spec/lib/client/Client_spec.js`, `spec/lib/jobs/*_spec.js`, `spec/support/utils/AxiosUtils.js`) to confirm no regression from the version bump.

## Benefits
Closes all currently known High/Moderate `axios` CVEs affecting the `source/` workspace, removing the Codacy/Trivy findings without changing client request behavior.
