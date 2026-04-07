# Plan: Pull Request Strategy

This feature is large enough to warrant splitting into multiple PRs. Each PR is independently reviewable and does not break existing behaviour.

---

## PR 1 — Infrastructure: Parsing, Mapping & Execution

Introduces the three new utility classes. No existing code is touched; all changes are purely additive and fully tested in isolation.

**New files:**
- `source/lib/exceptions/InvalidResponseBody.js`
- `source/lib/exceptions/NullResponse.js`
- `source/lib/exceptions/MissingMappingVariable.js`
- `source/lib/models/ResponseParser.js`
- `source/lib/models/VariablesMapper.js`
- `source/lib/models/ActionsExecutor.js`
- `source/spec/exceptions/InvalidResponseBody_spec.js`
- `source/spec/exceptions/NullResponse_spec.js`
- `source/spec/exceptions/MissingMappingVariable_spec.js`
- `source/spec/models/ResponseParser_spec.js`
- `source/spec/models/VariablesMapper_spec.js`
- `source/spec/models/ActionsExecutor_spec.js`

See: [`plan_response_parser.md`](plan_response_parser.md), [`plan_variables_mapper.md`](plan_variables_mapper.md), [`plan_actions_executor.md`](plan_actions_executor.md)

---

## PR 2 — Integration: Wiring actions into `ResourceRequest` and `Job`

Depends on PR 1. Makes the feature functional end-to-end: actions are parsed from config, stored in `ResourceRequest`, and executed after each successful HTTP response.

**New files:**
- `source/lib/exceptions/MissingActionResource.js`
- `source/lib/models/ResourceRequestAction.js`
- `source/spec/exceptions/MissingActionResource_spec.js`
- `source/spec/models/ResourceRequestAction_spec.js`
- `source/spec/support/factories/ResourceRequestActionFactory.js`
- `source/spec/support/fixtures/config/sample_config_with_actions.yml`

**Modified files:**
- `source/lib/models/ResourceRequest.js` — add `actions` to constructor, add `executeActions()`
- `source/lib/services/Client.js` — add `responseType: 'text'` to axios call
- `source/lib/models/Job.js` — call `executeActions(response.data)` after success
- `source/spec/models/ResourceRequest_spec.js` — add actions-related cases
- `source/spec/services/Client_spec.js` — assert `responseType: 'text'`, update mock data
- `source/spec/models/Job_spec.js` — assert `executeActions` is triggered on success
- `source/spec/support/factories/ResourceRequestFactory.js` — add `actions` param

See: [`plan_action_model.md`](plan_action_model.md), [`plan_job_execution.md`](plan_job_execution.md)

---

## PR 3 — Documentation

Can be opened in parallel with PR 2 or immediately after. No source code changes.

**Modified files:**
- `README.md`
- `DOCKERHUB_DESCRIPTION.md`
- `docs/agents/flow.md`
- `docs/agents/architecture.md`

See: [`plan_documentation.md`](plan_documentation.md)
