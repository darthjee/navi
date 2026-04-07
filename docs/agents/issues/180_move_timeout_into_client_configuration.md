# Issue: Move Timeout into Client Configuration

## Description

The HTTP client is initialized through the YAML configuration file. This issue adds an optional `timeout` key to the client configuration, allowing users to specify the request timeout in milliseconds. When the key is not provided, the default value of 5000 milliseconds applies.

## Problem

- The request timeout is currently hardcoded and cannot be configured per client.

## Expected Behavior

- The YAML configuration supports an optional `timeout` key under the client config.
- When `timeout` is provided, the HTTP client uses that value (in milliseconds) as the request timeout.
- When `timeout` is omitted, the client defaults to 5000 milliseconds.

## Solution

- Add an optional `timeout` field to the client configuration schema.
- Pass the `timeout` value (or the 5000 ms default) when initializing the HTTP client.
- Document the new key in the configuration reference.

## Benefits

- Users can tune timeout behavior per environment or use case without modifying source code.
- Makes the client more flexible and production-ready.

---
See issue for details: https://github.com/darthjee/navi/issues/180
