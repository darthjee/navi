# Developer Workflow

Development workflow is Docker-based.

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make setup` | Copies `.env.sample` to `.env`; copies `docker_volumes/config/navi_config.yml.sample` to `docker_volumes/config/navi_config.yml` (if absent); builds `base_build` service; installs Node dependencies via `yarn install`. |
| `make dev` | Runs the `navi_app` container with `/bin/bash`; allows interactive `yarn test`, `yarn lint`, etc. |
| `make tests` | Runs the `navi_tests` container with `/bin/bash` for an isolated test environment. |
| `make build-dev` | Builds the development Docker image tagged `navi:dev` from `dockerfiles/dev_navi_hey/Dockerfile`. |
| `make build` | Builds the production Docker image tagged `darthjee/navi-hey:latest` from `dockerfiles/production_navi_hey/Dockerfile`. |

## Directory Conventions

- Application source code must live in a folder named `source`.
- The `source` folder is mounted as a volume in `docker-compose.yml` for live development.
- Dockerfiles are stored under `dockerfiles/`.
- `docker_volumes/` is used for development/runtime mounted data:
  - `docker_volumes/config/` — YAML configuration files (never inside `source/`).
  - `docker_volumes/node_modules/` — Node modules cache mounted into the container.
