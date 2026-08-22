# Write the hub guide

Create `docs/guides/HOW_TO_USE_DEKU_SWARM.md`, matching the structure of `docs/guides/HOW_TO_USE_NAVI-CLIENT.md`:

- Title (`# How to Use deku-swarm`).
- A short description paragraph: what `deku-swarm` is (zero-dependency, queue-based worker pool for Node.js; no domain knowledge of HTTP/caching — you subclass `Job` and implement `perform()`), who the package was originally built for (extracted from Navi, but fully standalone), and who this guide is for (developers and AI agents integrating `deku-swarm` as an npm dependency into their own Node.js projects).
- An `## Table of Contents` section linking relatively to each sub-page, one line per page, each with a one-line description of its content:
  - `[Installation](./deku-swarm/installation.md)`
  - `[Defining Jobs](./deku-swarm/defining-jobs.md)`
  - `[Setup](./deku-swarm/setup.md)`
  - `[Running the Engine](./deku-swarm/running-the-engine.md)`
  - `[Job Lifecycle](./deku-swarm/job-lifecycle.md)`
  - `[Collections](./deku-swarm/collections.md)`
  - `[Reference](./deku-swarm/reference.md)`

Do not include a full library-usage code sample here beyond a minimal teaser (if any) — the end-to-end example belongs in `setup.md`/`running-the-engine.md`; keep the hub itself short, matching `HOW_TO_USE_NAVI-CLIENT.md`'s length (under 30 lines).

## Files to Change

- `docs/guides/HOW_TO_USE_DEKU_SWARM.md` — new hub file.
