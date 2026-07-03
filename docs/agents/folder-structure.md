# Folder Structure

## Project Root

| Directory / File | Description |
|-----------------|-------------|
| `source/` | Navi cache-warmer Node.js application (the main library). |
| `frontend/` | Navi web UI monitoring dashboard (React + Vite). |
| `dev/` | Sample apps and services used to exercise Navi in local development (dev backend, dev frontend, and two reverse proxies). |
| `dockerfiles/` | Dockerfiles for each service image (dev app, dev frontend, dev proxies, production build). |
| `docker_volumes/` | Development/runtime data mounted into containers via `docker-compose.yml`. |
| `scripts/` | Shell utilities for CI, release, and version bumping. |
| `docs/` | Project documentation, including the `docs/agents/` set read by AI coding agents. |
| `.circleci/` | CircleCI pipeline configuration. |
| `.github/` | GitHub PR/commit templates and Copilot instructions. |
| `AGENTS.md` | Shared instructions for all AI coding agents. |
| `CLAUDE.md` | Points to `AGENTS.md`. |
| `docker-compose.yml` | Defines the app, tests, dev, and proxy containers used in local development. |
| `Makefile` | Entry points for Docker-based workflows (`make dev`, `make tests`, `make build`, etc). |
| `README.md` | User-facing documentation: configuration format and usage. |
| `DOCKERHUB_DESCRIPTION.md` | Description published to Docker Hub for the `navi-hey` image. |
| `.env` / `.env.sample` | Environment variables for local Docker Compose setup. |
| `.codacy.yaml` | Codacy static analysis configuration. |
| `navi.png` | Project logo used in documentation. |

## `dev/` (Sample apps used to test Navi locally)

| Subdirectory | Description |
|--------------|-------------|
| `dev/app/` | Dev backend: dynamic Express JSON API that Navi's cache-warmer targets in tests. |
| `dev/frontend/` | Dev frontend: React SPA for browsing the dev backend API. |
| `dev/proxy/` | `navi_proxy`: Tent-powered reverse proxy dedicated to cache-warming tests. |
| `dev/web_proxy/` | `navi_web_proxy`: second Tent-powered reverse proxy (fronts the dev frontend/web UI). |

## `docker_volumes/` (Mounted development/runtime data)

| Subdirectory | Description |
|--------------|-------------|
| `docker_volumes/config/` | YAML configuration files for Navi (`navi_config.yml`), kept out of `source/`. |
| `docker_volumes/proxy_cache/` | Cache directory populated by the dev proxy during cache-warming tests. |
| `docker_volumes/static/` | Static assets served by the dev proxy. |
| `docker_volumes/node_modules*` | Node modules caches mounted into the various containers (app, dev, dev frontend). |
