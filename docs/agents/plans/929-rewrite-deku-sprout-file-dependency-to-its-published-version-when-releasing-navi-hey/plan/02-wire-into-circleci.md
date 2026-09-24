# Drop the rewrite from build-frontend and wire the new step into CircleCI

- Remove the `WORKER_VERSION=...` and `sed -i ... deku-swarm ...` lines from `scripts/ci/build-frontend.sh`. The script then only builds the frontend and copies `frontend/dist` into `source/static/`.
- In `.circleci/config.yml`, `npm-publish` job, add a step between "Build frontend" and "Publish to npm":

```yaml
      - run:
          name: Pin local dependencies
          command: scripts/ci.sh pin-local-deps
```

## Files to Change
- `scripts/ci/build-frontend.sh` — remove the `deku-swarm` rewrite.
- `.circleci/config.yml` — add the "Pin local dependencies" step to `npm-publish`.
