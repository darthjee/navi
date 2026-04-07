# Plan: Documentation Updates

## Overview

Update all user-facing and agent-facing documentation to reflect the `actions` feature: the current implementation (synchronous logging), the near-future plan (async queue with no retry), and the far-future plan (job generation with a referenced resource request).

---

## 1. `README.md`

### 1a — Fix the `actions` config example

The existing README config example uses `params:` inside actions, which is not the correct schema. Replace it with the correct `variables_map:` format:

```yaml
resources:
  categories:
    - url: /categories.json
      status: 200
      actions:
        - resource: category_information
        - resource: products
          variables_map:
            id: category_id   # response field "id" → variable "category_id"
  category_information:
    - url: /categories/{:id}.json
      status: 200
      actions:
        - resource: kind
          variables_map:
            kind_id: id       # response field "kind_id" → variable "id"
  products:
    - url: /categories/{:category_id}/products.json
      status: 200
  kind:
    - url: /kinds/{:id}.json
      status: 200
```

### 1b — Update the Fields table

Update the `actions` row and add `variables_map`:

| Field | Description |
|-------|-------------|
| `actions` | Optional list of follow-up actions to execute after a successful response. Each action names a `resource` and an optional `variables_map`. |
| `actions[].resource` | Name of the resource to act upon. |
| `actions[].variables_map` | Optional key-value map. Each entry renames a response field: `<response_field>: <new_variable_name>`. When absent, all response fields are passed through unchanged. |

### 1c — Add an "Actions & Response Chaining" section

Add a new section (before Roadmap) explaining:

- What actions do today: after a successful response, each action is executed for every item in the response (array or single object). The mapped variables are logged: `Executing action <resource> for <vars>`.
- What `variables_map` does: selectively renames response fields into variables.
- Error handling: an action with a missing `resource` field or a missing mapped variable is skipped and logged as an error; other actions continue.

### 1d — Update the Roadmap section

Add to Roadmap:

- **Action queue (near future)** — actions will be enqueued as special jobs for async processing. These jobs will not have retry rights.
- **Action job generation (far future)** — instead of logging, each action will create a real `Job` referencing the named resource and passing the mapped variables as parameters.

---

## 2. `DOCKERHUB_DESCRIPTION.md`

Apply the same changes as README §1a and §1b (config example and fields table). Keep it concise — skip the full "Actions & Response Chaining" narrative section, but add a brief bullet to the Key Features list:

> - **Response-driven actions**: after each request, configurable actions extract variables from the response and trigger follow-up processing.

---

## 3. `docs/agents/flow.md`

Add a new section **"6. Response Processing & Actions"** (after the existing worker/job execution section) describing:

- After `Client.perform()` resolves, `Job` passes the raw response body to `resourceRequest.executeActions(rawBody)`.
- `ResourceRequest.executeActions` returns immediately if there are no actions.
- `ResponseParser` parses the raw JSON body once. Throws `InvalidResponseBody` on parse failure.
- `ActionsExecutor` receives the parsed value. Throws `NullResponse` if `null`. Normalises to an array, then iterates items × actions.
- Per action, `ResourceRequestAction` calls `VariablesMapper.map(item)` to produce the transformed variables, then logs `Executing action <resource> for <vars>`.
- Action-level errors (`MissingMappingVariable`, `MissingActionResource`) are caught per action, logged, and execution continues with the next action.
- Future: actions will be enqueued instead of executed inline.

Also update the ASCII diagram at the top to include the action processing step:

```
Worker[]
  └─ Job.perform()
       └─ Client.perform(resourceRequest)
            ├─ axios.get(url, { responseType: 'text' })
            └─ resourceRequest.executeActions(response.data)
                 ├─ ResponseParser      → parse JSON once
                 └─ ActionsExecutor     → normalise + dispatch
                      └─ ResourceRequestAction.execute(item)
                           └─ VariablesMapper.map(item) → log vars
```

---

## 4. `docs/agents/architecture.md`

### 4a — Update the exceptions hierarchy

Add the new exceptions under `AppError`:

```
AppError (base)
├── ItemNotFound
│   ├── ClientNotFound
│   └── ResourceNotFound
├── MissingTopLevelConfigKey
│   ├── MissingClientsConfig
│   └── MissingResourceConfig
├── RequestFailed
├── LockedByOtherWorker
├── InvalidResponseBody   ← new: raw JSON body could not be parsed
├── NullResponse          ← new: parsed response body is null
├── MissingActionResource ← new: action config entry has no "resource" field
└── MissingMappingVariable ← new: variables_map references a field absent from the response
```

### 4b — Update the models table

Add the new model classes:

| Class | Responsibility |
|-------|---------------|
| `ResponseParser` | Parses a raw JSON string into a JS value. Throws `InvalidResponseBody` on failure. |
| `ActionsExecutor` | Normalises a parsed response (object or array) and dispatches each `ResourceRequestAction` per item. Throws `NullResponse` for null responses. Catches and logs action-level errors. |
| `ResourceRequestAction` | Represents a single action entry from the config. Uses `VariablesMapper` to transform the response item and logs the result. |
| `VariablesMapper` | Applies a `variables_map` to a response item, renaming fields. Throws `MissingMappingVariable` when a source field is absent. |

---

## Files to Change

- `README.md` — fix actions config example, update fields table, add actions section, update roadmap
- `DOCKERHUB_DESCRIPTION.md` — fix actions config example, update fields table, add key feature bullet
- `docs/agents/flow.md` — add response processing section, update ASCII diagram
- `docs/agents/architecture.md` — update exceptions hierarchy and models table
