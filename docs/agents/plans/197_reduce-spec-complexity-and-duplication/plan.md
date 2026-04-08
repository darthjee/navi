# Plan: Reduce complexity and duplication in spec files

## Overview

Several spec files have grown repetitive or overly verbose. This plan refactors them one by one
to reduce duplication and improve readability, without changing any tested behaviour.
All changes are in test files only — no production code is touched.

## Sub-plans

| File | Plan |
|------|------|
| `source/spec/utils/BaseLogger_spec.js` | [plan_base_logger.md](plan_base_logger.md) |
| `source/spec/utils/SortedCollection_spec.js` | [plan_sorted_collection.md](plan_sorted_collection.md) |
| `source/spec/services/Engine_spec.js` | [plan_engine.md](plan_engine.md) |
| `source/spec/services/ConfigLoader_spec.js` | [plan_config_loader.md](plan_config_loader.md) |
| `dev/app/spec/` (shared fixtures + Router/RouteRegister/RequestHandler/app) | [plan_dev_app_specs.md](plan_dev_app_specs.md) |

## CI Checks

Before opening a PR, run the following checks for the folders being modified:
- `source/`: `cd source; yarn test` and `cd source; yarn lint` (CircleCI jobs: `jasmine`, `checks`)
- `dev/app/`: `cd dev/app; yarn test` and `cd dev/app; yarn lint` (CircleCI jobs: `jasmine-dev`, `checks-dev`)

## Notes

- No production code is changed — all changes are in spec and support files.
- JSCPD should show improvement or no regression after these changes.
- Each sub-plan can be implemented and verified independently.
