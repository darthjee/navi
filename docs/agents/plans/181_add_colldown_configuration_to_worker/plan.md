# Plan: Add Cooldown Configuration to Worker

## Overview

Expose the retry cooldown duration as an optional `workers.retry_cooldown` key in the
YAML configuration. The value is stored in `WorkersConfig`, then passed to `JobRegistry`
when `Application` initialises its registries. Default is 2000 ms.

## Context

`JobRegistry` already accepts a `cooldown` parameter (currently defaulting to 5000 ms),
and applies it via `job.applyCooldown(this.#cooldown)` when a job fails. However,
`Application.#initRegistries` never passes this parameter, so the hardcoded default is
always used in production.

`WorkersConfig` is constructed from the `workers:` YAML key via `ConfigParser`, and its
fields are spread into `WorkersRegistry`. `JobRegistry` is created separately and does
not yet receive anything from `WorkersConfig`.

## Implementation Steps

### Step 1 — Add `retryCooldown` to `WorkersConfig`

In `source/lib/models/WorkersConfig.js`, destructure `retry_cooldown` (snake_case, as
used in YAML) and store it as `retryCooldown`:

```js
constructor({ quantity = 1, retry_cooldown: retryCooldown = 2000 } = {}) {
  this.quantity = quantity;
  this.retryCooldown = retryCooldown;
}
```

### Step 2 — Wire `retryCooldown` into `JobRegistry` from `Application`

In `source/lib/services/Application.js`, pass `cooldown` when creating `JobRegistry`
inside `#initRegistries`:

```js
this.jobRegistry = jobRegistry || new JobRegistry({
  clients: this.config.clientRegistry,
  cooldown: this.config.workersConfig.retryCooldown,
});
```

### Step 3 — Update `WorkersConfig_spec.js`

Add `retryCooldown` assertions to the three existing describe blocks, and add a
describe block for when the key is present:

- `{ quantity: 5, retry_cooldown: 3000 }` → `retryCooldown === 3000`
- `{ quantity: 5 }` (no retry_cooldown) → `retryCooldown === 2000`
- `{}` → `retryCooldown === 2000`
- `WorkersConfig()` (no argument) → `retryCooldown === 2000`

### Step 4 — Create fixture `sample_config_with_retry_cooldown.yml`

Create `source/spec/support/fixtures/config/sample_config_with_retry_cooldown.yml`
with an explicit `retry_cooldown` value to test the non-default path through
`ConfigParser`:

```yaml
workers:
  quantity: 5
  retry_cooldown: 3000
clients:
  default:
    base_url: https://example.com
    timeout: 5000
resources:
  categories:
    - url: /categories.json
      status: 200
```

### Step 5 — Add a `ConfigParser_spec` test for explicit `retry_cooldown`

In `source/spec/services/ConfigParser_spec.js`, add a describe block inside
`.fromObject` that loads the new fixture and verifies the correct `WorkersConfig`
is built:

```js
describe('when workers config includes retry_cooldown', () => {
  beforeEach(() => {
    config = FixturesUtils.loadYamlFixture('config/sample_config_with_retry_cooldown.yml');
  });

  it('returns a WorkersConfig with the configured retry cooldown', () => {
    const result = ConfigParser.fromObject(config);
    expect(result.workersConfig).toEqual(
      new WorkersConfig({ quantity: 5, retry_cooldown: 3000 })
    );
  });
});
```

The existing "valid config" test (using `sample_config.yml`, which has no
`retry_cooldown`) continues to pass because both the expected and actual
`WorkersConfig` will default `retryCooldown` to 2000.

### Step 6 — Update agent documentation (`architecture.md`)

In `docs/agents/architecture.md`, update the `WorkersConfig` row in the models table:

> Holds the worker pool size (`quantity`, default 1) and the retry cooldown in
> milliseconds (`retryCooldown`, default 2000).

### Step 7 — Update `README.md` and `DOCKERHUB_DESCRIPTION.md`

In both files, add `retry_cooldown` to the YAML structure example and to the
configuration fields table:

**YAML example** (under `workers:`):
```yaml
workers:
  quantity: 5          # number of concurrent workers (default: 1)
  retry_cooldown: 2000 # ms before a failed job is retried (default: 2000)
```

**Table row** (after `workers.quantity`):
```
| `workers.retry_cooldown` | Milliseconds a failed job waits before being re-queued for retry. Defaults to `2000`. |
```

## Files to Change

- `source/lib/models/WorkersConfig.js` — add `retryCooldown` field with default 2000 ms
- `source/lib/services/Application.js` — pass `cooldown` to `JobRegistry`
- `source/spec/models/WorkersConfig_spec.js` — add `retryCooldown` test cases
- `source/spec/services/ConfigParser_spec.js` — add describe for explicit `retry_cooldown`
- `source/spec/support/fixtures/config/sample_config_with_retry_cooldown.yml` — new fixture
- `docs/agents/architecture.md` — update `WorkersConfig` description
- `README.md` — add `retry_cooldown` to YAML example and config table
- `DOCKERHUB_DESCRIPTION.md` — same as README

## CI Checks

Before opening a PR, run the following checks for the `source/` folder:

- `source`: `docker-compose run --rm navi_tests yarn test` (CircleCI job: `jasmine`)
- `source`: `docker-compose run --rm navi_tests yarn lint` (CircleCI job: `checks`)

## Notes

- `JobRegistry`'s own `cooldown` default (5000 ms) is only a fallback for direct test
  instantiation. Production will always receive the value from `WorkersConfig`.
- `Application_spec.js` does not need changes: it tests that `jobRegistry` is a
  `JobRegistry` instance, not the specific cooldown value.
