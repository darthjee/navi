# Plan: Upgrade react-router (7.14.2) — DoS and CSRF bypass CVEs

Issue: [837-upgrade-react-router--7-14-2----dos-and-csrf-bypass-cves.md](../../issues/837-upgrade-react-router--7-14-2----dos-and-csrf-bypass-cves.md)

## Overview
Bump `react-router-dom` in `frontend/package.json` from `7.14.2` to `7.18.3`, which pulls the lockstep-pinned `react-router` transitive dependency past the vulnerable range, then re-lock and verify the frontend build/test/lint still pass.

See [frontend.md](frontend.md) for the full plan.
