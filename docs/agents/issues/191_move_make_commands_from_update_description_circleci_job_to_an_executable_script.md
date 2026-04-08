# Issue: Move make commands from update-description CircleCI job to an executable script

## Description

The `update-description` job in CircleCI uses `make` commands to execute its steps.
However, the container used by this job does not have `make` installed, causing the job to fail at runtime.
The fix is to extract those commands into a standalone executable script and update the CircleCI workflow to call it directly.

## Problem

- The `update-description` CircleCI job calls `make` commands.
- The job container does not have `make` installed.
- The job fails during execution because of this missing dependency.

## Expected Behavior

- The `update-description` job runs successfully without requiring `make` in the container.
- All steps previously triggered via `make` are executed through a standalone script.

## Solution

- Identify all `make` commands used in the `update-description` CircleCI job.
- Create a new executable script (e.g. `scripts/update-description.sh`) containing those commands.
- Ensure the script has execution permissions (`chmod +x`).
- Update the CircleCI workflow configuration to call the script directly instead of `make`.

## Benefits

- Removes the dependency on `make` from the CircleCI job container.
- Ensures the job runs reliably in environments where `make` is not installed.
- Keeps CI logic self-contained in a versioned script rather than relying on a build tool.

---
See issue for details: https://github.com/darthjee/navi/issues/191
