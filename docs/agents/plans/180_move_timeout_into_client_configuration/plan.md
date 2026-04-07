# Plan: Move Timeout into Client Configuration

## Overview

Add a default value of 5000 ms for the `timeout` option in the `Client` class.
The YAML configuration key `timeout` already exists and is forwarded to axios —
the only missing piece is the fallback when the key is omitted.

## Context

`Client.fromObject` already reads `config.timeout` and passes it to the constructor,
which forwards it to `axios.get`. When the key is absent, `timeout` is `undefined`
and axios uses its own internal default (no limit). The issue requires a project-level
default of 5000 ms to be applied instead.

## Implementation Steps

### Step 1 — Add default value to `Client` constructor

In `source/lib/services/Client.js`, change the constructor destructuring from:

```js
constructor({ name, baseUrl, timeout }) {
```

to:

```js
constructor({ name, baseUrl, timeout = 5000 }) {
```

JavaScript destructuring defaults apply when the value is `undefined`, so this
covers both the "key absent from YAML" case (forwarded as `undefined`) and any
direct instantiation without a timeout.

### Step 2 — Update the affected unit test in `Client_spec.js`

In `source/spec/services/Client_spec.js` (line 28), the default-client test currently
asserts `{ timeout: undefined }`. Rename the describe block to make the intent clear
and update the assertion:

```js
// before
expect(axios.get).toHaveBeenCalledWith(fullUrl, { timeout: undefined });

// after
expect(axios.get).toHaveBeenCalledWith(fullUrl, { timeout: 5000 });
```

The `when a timeout is configured` describe block (explicit 5000 ms) is unaffected.

### Step 3 — Create a fixture without timeout

Create `source/spec/support/fixtures/config/sample_config_without_timeout.yml`
as a copy of `sample_config.yml` with the `timeout` key removed:

```yaml
workers:
  quantity: 5
clients:
  default:
    base_url: https://example.com
resources:
  categories:
    - url: /categories.json
      status: 200
```

This fixture makes the "no timeout provided" path explicit and isolated from
`missing_workers_config.yml`, which exists to test a different concern.

### Step 4 — Add a `ConfigParser_spec` test for the default timeout

In `source/spec/services/ConfigParser_spec.js`, add a new `describe` block inside
`.fromObject` that loads the new fixture and verifies the client receives the default:

```js
describe('when client config has no timeout', () => {
  beforeEach(() => {
    config = FixturesUtils.loadYamlFixture('config/sample_config_without_timeout.yml');
  });

  it('returns a client with the default timeout of 5000ms', () => {
    const result = ConfigParser.fromObject(config);
    expect(result.clients).toEqual({
      default: ClientFactory.build({ timeout: 5000 }),
    });
  });
});
```

## Files to Change

- `source/lib/services/Client.js` — add `= 5000` default in constructor destructuring
- `source/spec/services/Client_spec.js` — update one assertion from `undefined` to `5000`
- `source/spec/services/ConfigParser_spec.js` — add describe block for default timeout
- `source/spec/support/fixtures/config/sample_config_without_timeout.yml` — new fixture (no `timeout` key)

## CI Checks

Before opening a PR, run the following checks for the `source/` folder:

- `source`: `docker-compose run --rm app yarn test` (CircleCI job: `jasmine`)
- `source`: `docker-compose run --rm app yarn lint` (CircleCI job: `checks`)

## Notes

- No changes are required to `ConfigParser`, `ClientFactory`, YAML fixtures, or documentation.
- The `sample_config.yml` fixture already sets `timeout: 5000`, so the "with explicit timeout" path is already covered by tests.
