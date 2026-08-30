# Add InvalidEmitBodyTemplate exception

Add a new config exception, thrown when `emit.body_template` is given but isn't a plain object or array. Mirror `InvalidEmitHeaders` exactly in shape (message format, `AppError` base, storing the offending value on the instance).

## Files to Change

- `source/lib/exceptions/config/InvalidEmitBodyTemplate.js` — new file, modeled on `source/lib/exceptions/config/InvalidEmitHeaders.js`: extends `AppError`, message `Invalid emit body_template: ${JSON.stringify(bodyTemplate)}. Expected a plain object or array`, stores `this.bodyTemplate = bodyTemplate`.
