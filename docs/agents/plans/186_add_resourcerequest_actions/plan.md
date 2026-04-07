# Plan: Add ResourceRequest Actions

## Overview

Add an optional `actions` list to each `ResourceRequest` config entry. After a successful HTTP response, each action is executed: it applies an optional `variables_map` to the response data and logs a message. If the response is an array, each action runs once per element; if it is a single object, it runs once.

## Sub-plans

| File | Contents |
|------|----------|
| [Action Model & Config Loading](plan_action_model.md) | `ResourceRequestAction` class, how it is parsed from YAML and stored inside `ResourceRequest` |
| [Response Parser](plan_response_parser.md) | `ResponseParser` class — JSON parsing of the raw response body |
| [Variables Mapper](plan_variables_mapper.md) | `VariablesMapper` class — applies `variables_map` to a response item |
| [Actions Executor](plan_actions_executor.md) | `ActionsExecutor` class — handles array vs object normalisation and dispatches actions |
| [Job Execution](plan_job_execution.md) | How `Job` triggers action execution after a successful response |

## Evolution Notes

This implementation is the first of three planned phases:

| Phase | What happens with an action |
|-------|-----------------------------|
| **Now** | Executed synchronously; logs `Executing action <resource> for <vars>` |
| **Near future** | Enqueued as a special `Job` — async processing, **no retry rights** |
| **Far future** | The job references the named `resource` and uses `vars` as its parameters, generating a real `ResourceRequest` |

These phases are marked with `TODO` comments in the relevant source files.

## CI Checks

Before opening a PR, run the following checks for the `source/` folder:

- `source`: `docker-compose run --rm source yarn spec` (CircleCI job: `jasmine`)
- `source`: `docker-compose run --rm source yarn lint` (CircleCI job: `checks`)
