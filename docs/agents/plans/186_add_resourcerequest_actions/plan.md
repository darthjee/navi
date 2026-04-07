# Plan: Add ResourceRequest Actions

## Overview

Add an optional `actions` list to each `ResourceRequest` config entry. After a successful HTTP response, each action is executed: it applies an optional `variables_map` to the response data and logs a message. If the response is an array, each action runs once per element; if it is a single object, it runs once.

## Sub-plans

| File | Contents |
|------|----------|
| [Action Model & Config Loading](plan_action_model.md) | `ResourceRequestAction` class, how it is parsed from YAML and stored inside `ResourceRequest` |
| [Job Execution](plan_job_execution.md) | How `Job` triggers action execution after a successful response |

## CI Checks

Before opening a PR, run the following checks for the `source/` folder:

- `source`: `docker-compose run --rm source yarn spec` (CircleCI job: `jasmine`)
- `source`: `docker-compose run --rm source yarn lint` (CircleCI job: `checks`)
