# Plan: Add README Information to npm Package

## Overview

Create a dedicated README file for the npm package listing, mirroring the existing `dockerhub_description` file used for Docker Hub. Wire `package.json` to reference it so the npm registry displays proper documentation.

## Context

Navi is distributed both as a Docker image (using `dockerhub_description` for its registry page) and as an npm CLI package. The npm package currently has no dedicated readme, leaving its registry page undocumented. The fix follows the same pattern already established for Docker Hub.

## Implementation Steps

### Step 1 — Inspect the existing `dockerhub_description` file

Review the content and format of the `dockerhub_description` file to use it as a reference for tone, structure, and content when writing the npm README.

### Step 2 — Create `npm_description.md`

Create a new file (e.g., `npm_description.md`) at the project root with content tailored for npm audiences:
- What Navi is and what problem it solves
- Installation instructions (`npm install -g navi-hey` / `yarn global add navi-hey`)
- Basic usage (CLI flags, config file)
- Link to the full documentation or repository

### Step 3 — Wire `package.json` to use the new file

Add or update the `"readme"` field in `package.json` to point to `npm_description.md`, so the npm registry picks it up when the package is published:

```json
{
  "readme": "npm_description.md"
}
```

Alternatively, if npm's convention of `README.md` at the root is preferred, name the file `README.md` directly (no `package.json` change needed, as npm reads it automatically).

### Step 4 — Verify locally

Publish a dry-run (`npm publish --dry-run`) or inspect the packed tarball (`npm pack`) to confirm the readme file is included and correctly referenced.

## Files to Change

- `npm_description.md` (new) — dedicated README content for the npm registry page
- `package.json` — add/update the `"readme"` field to reference the new file (only needed if the file is not named `README.md`)

## Notes

- The file name convention (`npm_description.md` vs `README.md`) is an open question. Using `README.md` is zero-config for npm but may conflict with a root-level repo README if one is added later. Using a custom name keeps it explicit but requires the `"readme"` field in `package.json`.
- Check whether there is already a `README.md` at the project root before deciding on the filename.
- The npm `"readme"` field is not officially documented in all npm versions; verify it works with the npm version in use, or prefer the `README.md` convention.
