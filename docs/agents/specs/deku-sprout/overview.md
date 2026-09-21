# Overview

## The problem

Two places carry their own copy of the same logging code:

| Class | `source/lib/common/utils/logging/` | `clients/node/lib/logging/` | Difference |
|---|---|---|---|
| `BaseLogger` | 98 lines | 103 lines | doc comment only |
| `ConsoleLogger` | 20 lines | 25 lines | doc comment only |
| `Logger` | 138 lines | 115 lines | the engine's is group-aware (it uses `LoggerGroup`); the client's wraps a single `ConsoleLogger` |

Their specs are duplicated as well (`ConsoleLogger_spec.js` and `Logger_spec.js` exist in both places) and Codacy flags them as clones. Repository duplication sits at 18% against a goal of 10%. The two copies are kept in sync by hand, so any fix or improvement to one has to be remembered and repeated in the other.

## Goals

- The shared logging code, and its specs, live in one place.
- `source/`, `clients/node/` and `dev/app` consume it from there.
- No change in logging behaviour.

## Non-goals

- No change to the logging API or output.
- No move of the Navi-specific classes (`Log`, `LogContext`, `LogFactory`, `LogFilter`, `buffer/`), which stay in `source/`.
