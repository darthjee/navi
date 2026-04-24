# Issue: Add documentation on how to use navi

## Description

Add a `HOW_TO_USE_NAVI.md` file under `docs/` to help other AIs (and developers) understand how to apply Navi in their own projects.

## Problem

- There is no documentation explaining how external projects can integrate or use Navi as a cache-warmer.
- Other AIs and developers lack a clear guide to set up Navi in CI/CD pipelines or standalone environments.

## Expected Behavior

- A `docs/HOW_TO_USE_NAVI.md` file exists describing concrete integration options.

## Solution

- Create `docs/HOW_TO_USE_NAVI.md` covering at least the following usage scenarios:
  1. **CI release step using the Docker image**: Add a warm-cache step in the release pipeline that uses the `darthjee/navi-hey` Docker image, pointing to a configuration file so Navi warms the cache without a web interface.
  2. **Node.js-capable CI image**: In a Node.js-capable CI image, install `navi-hey` and run it directly to warm the cache, again without the web interface.

## Benefits

- External projects and AI agents can quickly understand how to integrate Navi.
- Reduces onboarding friction for teams wanting to adopt Navi as a cache-warmer in their pipelines.

---
See issue for details: https://github.com/darthjee/navi/issues/337
