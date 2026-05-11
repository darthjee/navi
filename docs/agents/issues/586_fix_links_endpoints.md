# Issue: Fix Links Endpoints

## Description

`LinksHandler` receives `webConfig.links` from the YAML configuration. When only a single link is configured, YAML parsing produces a plain object instead of a single-element array. The `#allLinks()` method then fails because it uses spread (`...this.#links`) expecting an array.

## Problem

- When the YAML config has a single `links` entry, the parsed value is an object, not an array.
- `LinksHandler#allLinks()` calls `[...this.#links, ...this.#clientLinks()]`, which throws when `this.#links` is not iterable.
- The `/links.json` endpoint fails in any configuration with exactly one link.

## Expected Behavior

- `LinksHandler` should treat a single-link config the same as a multi-link config.
- `/links.json` must return the correct JSON response regardless of whether one or many links are configured.

## Solution

- Normalize `this.#links` to always be an array in the `LinksHandler` constructor (e.g. `this.#links = [].concat(links ?? [])`).
- Add a spec covering the single-link case to prevent regression.

## Benefits

- Makes the links endpoint robust to YAML single-value vs. array ambiguity.
- Consistent behaviour regardless of how many links are configured.

---
See issue for details: https://github.com/darthjee/navi/issues/586
