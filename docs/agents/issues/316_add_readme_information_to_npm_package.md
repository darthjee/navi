# Issue: Add README Information to npm Package

## Description

Just as Navi provides a dedicated `dockerhub_description` file for the Docker Hub listing, it needs a dedicated README file to be used as the package description on npm.

## Problem

- The npm package currently lacks a dedicated README file for its npm registry page.
- Without a proper README, the npm listing provides no useful documentation for users discovering or evaluating the package.

## Expected Behavior

- A dedicated file (e.g., `README.md` or similar) is included in the npm package and used as the readme displayed on the npm registry page.
- The file should mirror the purpose of `dockerhub_description` but be tailored for npm audiences.

## Solution

- Create a dedicated README file for the npm package (following the same pattern as `dockerhub_description` for Docker Hub).
- Configure `package.json` to reference this file via the `readme` field (or ensure the standard `README.md` is included in the published package).

## Benefits

- Improves discoverability and usability of the npm package on the registry.
- Gives npm users the same quality of documentation available to Docker Hub users.

---
See issue for details: https://github.com/darthjee/navi/issues/316
