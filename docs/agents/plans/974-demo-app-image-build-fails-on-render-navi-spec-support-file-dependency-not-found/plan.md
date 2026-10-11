# Plan: Demo app image build fails on Render: navi-spec-support file dependency not found

Issue: [974-demo-app-image-build-fails-on-render-navi-spec-support-file-dependency-not-found.md](../../issues/974-demo-app-image-build-fails-on-render-navi-spec-support-file-dependency-not-found.md)

## Overview
Copy `spec-support/` into the `frontend` stage of `dockerfiles/demo_dev_app/Dockerfile` so `yarn install` can resolve the `navi-spec-support` file dependency.

See [docker.md](docker.md) for the full plan.
