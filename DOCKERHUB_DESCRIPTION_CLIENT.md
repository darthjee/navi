# navi-hey-client

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/d931f6260973439f850c20869eeb5d83)](https://app.codacy.com/gh/darthjee/navi/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/d931f6260973439f850c20869eeb5d83)](https://app.codacy.com/gh/darthjee/navi/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_coverage)
[![Build Status](https://circleci.com/gh/darthjee/navi.svg?style=shield)](https://circleci.com/gh/darthjee/navi)

---

## Overview

`navi-hey-client` is a thin Node.js client (library + CLI) for [Navi](https://github.com/darthjee/navi)'s token-secured `/api/*` HTTP namespace (`POST /api/config`, `POST /api/engine/start`, `POST /api/engine/stop`), wrapped in a ready-to-run Docker image. It allows external, programmatic control of a running Navi instance without hand-rolling requests and bearer-token handling yourself.

---

## Quick Start

The image's default command is `navi-client` itself (`CMD navi-client`, no `ENTRYPOINT`), so it must be named explicitly in every invocation:

```bash
docker run --rm darthjee/navi-hey-client:latest \
  navi-client --base-url http://localhost:3000 --token $NAVI_API_TOKEN --action engine-stop
```

### CircleCI

Declare `darthjee/navi-hey-client:latest` directly as the job's executor image to get direct filesystem access to checked-out files with no Docker-in-Docker:

```yaml
jobs:
  warm-cache:
    docker:
      - image: darthjee/navi-hey-client:latest
    steps:
      - checkout
      - run:
          name: Warm cache with Navi client
          command: navi-client --base-url https://your-app.example.com --token $NAVI_API_TOKEN --action engine-start
```

---

## CLI options

| Option | Short | Description |
|--------|-------|--------------|
| `--base-url` | `-b` | Base URL of the running Navi instance. Required. |
| `--token` | `-t` | Bearer token. Required. |
| `--action` | `-a` | One of `config`, `engine-start`, `engine-stop`. Required. |
| `--payload` | `-p` | Optional JSON request body (used by `config`/`engine-start`). |

---

## Source & Documentation

GitHub repository: [darthjee/navi](https://github.com/darthjee/navi)

Integration guide for developers and AI agents: [How to Use navi-hey-client](https://github.com/darthjee/navi/blob/main/docs/guides/HOW_TO_USE_NAVI-CLIENT.md)
