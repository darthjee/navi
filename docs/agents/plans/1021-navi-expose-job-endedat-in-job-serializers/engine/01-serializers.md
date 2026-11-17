# Add endedAt to the job serializers

Add an `endedAt` key to the object built in `_serializeObject` of both job serializers, following the shared contract: an ISO string from `job.endedAt` when it is a number, otherwise `null`. It is always present and not gated by status. This differs on purpose from `remainingAttempts` / `readyInMs` / `lastError`, which use status sets.

Use one small helper shared by both serializers (e.g. an exported function in a new `source/lib/serializers/helpers/` module, or a static on a shared base) so the conversion and `null` handling live in one place. Update the JSDoc `@returns` shapes (index: `{ id, status, attempts, jobClass, endedAt, url? }`).

## Files to Change

- `source/lib/serializers/JobIndexSerializer.js` — add `endedAt` to the result and update the JSDoc return type.
- `source/lib/serializers/JobShowSerializer.js` — add `endedAt` to the result and update the JSDoc.
- `source/lib/serializers/<helper>.js` (new, optional) — the shared `endedAt` → ISO/null conversion.
