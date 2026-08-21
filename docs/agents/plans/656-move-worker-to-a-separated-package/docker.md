# docker Plan: Move worker to a separated package

Main plan: [plan.md](plan.md)

## Shared contracts

- `engine` produces a `worker/` folder at the repo root and adds `"deku-swarm": "file:../worker"` to `source/package.json`. This mount must resolve that dependency inside the container: `file:../worker` from `/home/node/app` (where `source/` is mounted) means `/home/node/worker` must exist and hold the package.

## Implementation Steps

### Step 1 — Mount worker/ in docker-compose.yml

Add a `./worker` volume to the `base` service anchor, inherited by `navi_app` and `navi_tests`:

```yaml
base: &base
  image: navi:dev
  env_file: .env
  volumes:
    - ./source:/home/node/app
    - ./worker:/home/node/worker          # NEW
    - ./docker_volumes/config:/home/node/app/config
    - ./docker_volumes/node_modules:/home/node/app/node_modules
```

## Files to Change

- `docker-compose.yml` — add the `./worker:/home/node/worker` volume line to the `base` service anchor.

## Notes

- No dedicated CI job builds/tests Dockerfiles or `docker-compose.yml` on branches/PRs. Verify locally: `make build-dev` followed by `docker compose run --rm navi_tests bash -c "yarn install && yarn coverage"` to confirm the container can see and resolve `file:../worker`.
- This step only makes sense after `engine`'s work has landed (`worker/` needs to exist with a real `package.json` for the mount to be useful) — but the compose line itself can be authored and reviewed independently.
