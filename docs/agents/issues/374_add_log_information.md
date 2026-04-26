# Issue: Add Log Information

## Description

In `source/`, the logger API needs to support an optional attributes object alongside the message. The call signature changes from `Logger.debug(message)` to `Logger.debug(message, { some_attributes })`. This lays the groundwork for future log filtering via an API.

## Problem

- The current logger accepts only a message string, with no way to attach structured metadata to a log entry.
- Future features (e.g., filtering logs by job ID, resource name, or status) cannot be built without structured attributes on log entries.

## Expected Behavior

- All logger methods (`debug`, `warn`, `error`, etc.) accept an optional second argument: a plain object of attributes.
- The attributes are stored on the `Log` entry alongside the message.
- All existing logger implementations are updated to handle the new signature.

## Solution

- Update the `Log` model to store an `attributes` field in addition to `id`, `level`, and `message`.
- Update `BaseLogger` (and all subclasses: `ConsoleLogger`, `BufferedLogger`) to accept and forward the attributes argument.
- Update the `Logger` facade and `LoggerGroup` to pass attributes through to their delegates.
- Update `LogFactory` to attach attributes when building `Log` instances.
- Update all existing call sites in `source/` to remain compatible (attributes are optional, so existing calls need no changes).

## Benefits

- Enables structured logging, making log entries machine-readable and filterable.
- Provides the foundation for a future log-filtering API endpoint.

---
See issue for details: https://github.com/darthjee/navi/issues/374
