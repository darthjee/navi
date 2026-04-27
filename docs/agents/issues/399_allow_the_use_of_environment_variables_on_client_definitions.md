# Issue: Allow the Use of Environment Variables on Client Definitions

## Description

Currently, when defining clients in the YAML configuration file (base URL, headers, or any other field), there is no support for environment variable interpolation. Users need to be able to reference environment variables directly in their client definitions.

## Problem

- Client configuration fields such as `base_url` and headers do not support environment variable substitution.
- There is no way to externalize sensitive or environment-specific values (e.g. domain URLs) out of the YAML config file.

## Expected Behavior

- Environment variables should be resolvable using the `${VAR_NAME}` syntax anywhere in client definitions, for example:

```yaml
clients:
  default:
    base_url: ${DOMAIN_BASE_URL}
```

## Solution

- Implement environment variable interpolation for client configuration fields when parsing the YAML config.
- Support the `${VAR_NAME}` syntax, resolving values from `process.env` at load time.
- Update documentation to reflect this capability:
  - HOW-TO-USE guide
  - `README.md`
  - `source/README.md`
  - DOCKERHUB `description.md`

## Benefits

- Enables users to keep sensitive configuration (like base URLs and auth headers) out of version-controlled YAML files.
- Improves compatibility with container-based deployments where environment variables are the standard way to inject configuration.

---
See issue for details: https://github.com/darthjee/navi/issues/399
