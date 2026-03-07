# Copilot Instructions

## Project Objective

Navi is a Node.js application designed to run inside Docker and be distributed as a Docker image.

Its primary purpose is to warm caches by performing HTTP requests based on a user-provided YAML configuration file mounted as a Docker volume.

## Runtime and Configuration Model

The application must read a `.yml` configuration file with a top-level `resources` key.

The configuration file may also define:

- **Execution settings**
  - Example: number of workers and runtime behavior.
- **Client settings**
  - Example: target domain/base URL and optional additional headers.
- **Resource settings**
  - Defined under the top-level `resources` key.
  - Example: resources such as `categories` or `category`.
  - Each resource item can define fields like `url`, expected `status`, and optional `resource` for chaining.

Each resource defines one or more request entries to fetch data, for example:

```yaml
resources:
  categories:
    - url: /categories.html
      status: 302
    - url: /categories.html?ajax=true
      status: 200
    - url: /categories.json
      status: 200
      resource: category
  category:
    - url: /categories/{:id}.html
      status: 302
    - url: /categories/{:id}.html?ajax=true
      status: 200
    - url: /categories/{:id}.json
      status: 200
      resource: category_items
  category_items:
    - url: /categories/{:category_id}/items.html
      status: 302
    - url: /categories/{:category_id}/items.html?ajax=true
      status: 200
    - url: /categories/{:category_id}/items.json
      status: 200
      resource: category_item
  category_item:
    - url: /categories/{:category_id}/items/{:id}.html
      status: 302
    - url: /categories/{:category_id}/items/{:id}.html?ajax=true
      status: 200
    - url: /categories/{:category_id}/items/{:id}.json
      status: 200
```

Some URLs may produce data that links to other resources. For example:

- `/categories.json` returns a list of categories.
- For each category ID, the `category` resource is processed.
- For each category item ID, the `category_item` resource is processed.
- That enables requests such as `/categories/{:id}.json` and `/categories/{:category_id}/items/{:id}.json`.

This chaining model can continue recursively according to resource definitions.

URL templates may contain placeholders (for example, `{:id}` and `{:category_id}`) that are resolved from previously fetched resource data.

## Processing Architecture

Navi should use a queue-based processing model:

- Start from one or more initial resources.
- Process each fetched result and enqueue follow-up resources generated from that result.
- Use workers to consume the queue concurrently.
- Worker behavior and concurrency are controlled by configuration.

## Operating Direction

Current direction:

- Focus on a command-line execution model for CI usage.
- Keep architecture ready for a future local frontend to monitor and run jobs.

## Developer Operation Model

Development workflow must be Docker-based and include:

- A `docker-compose.yml` file with the development containers.
- A `Makefile` exposing the primary developer commands.

Required `Makefile` commands:

- `make setup`
  - Prepares the development environment.
  - Creates env files from sample templates.
  - Builds the development containers/images.
- `make dev`
  - Starts the development container with `/bin/bash` as the entry command.
  - Allows the developer to run `jasmine` and any other necessary commands interactively.

Source code location and mounting rules:

- Application source code must live in a folder named `source`.
- The `source` folder must be mounted as a volume in `docker-compose.yml` for live development.

Docker files and volume structure:

- Dockerfiles must be stored under a `dockerfiles` folder.
- Expected structure:
  - Development image: `dockerfiles/dev_navy/Dockerfile`
  - Production image: `dockerfiles/navy/Dockerfile`
- A `docker_volumes` folder must be used for development/runtime mounted data.
- Example volume usage:
  - Config files can live in `docker_volumes/config/`.
  - The YAML configuration file must not live inside `source`.
  - `docker_volumes/config/` can be mounted in development without affecting the final production image contents.

## Engineering Standards

- All pull requests must be written in English.
- All source code must be written in English.
- All comments and documentation must be written in English.

## Quality and Tooling

- Unit tests must use **Jasmine**.
- Linting must use **ESLint**.
- Copy/paste and duplication analysis must use **JSCPD**.
- CI test execution must run on **CircleCI**.
- Code quality gates should integrate with tools such as **Codacy**.

## Implementation Guidelines for Copilot

When generating or modifying code:

1. Prefer queue-driven designs over hardcoded sequential request flows.
2. Keep resource resolution configurable via YAML instead of hardcoding domains, headers, or URLs.
3. Treat resource chaining as a first-class concern.
4. Keep worker logic deterministic and testable.
5. Prioritize CI-oriented execution paths while avoiding assumptions that block future frontend integration.
6. Add or update JSDoc documentation when creating or modifying classes and methods.
