# Cover endedAt in serializer and handler specs

**Serializer specs:** for both the index and show serializers, add cases for:

- a job after `markEnded(<fixed ms>)` → `endedAt` equals the exact expected ISO string (a fixed timestamp, no clock mocking);
- a job that never ended → `endedAt: null`;
- a job that ended and then had `clearEnded()` called (the retry path) → `endedAt: null`;
- a job double with `endedAt` `undefined` → `endedAt: null`.

`JobSerializer_spec.js`: the dispatcher carries `endedAt` through both `index` and `show` views.

**Handler specs:** update the expected payloads, which now include `endedAt`. Add a case where a job is finished through the real registry `finish()` path and assert `endedAt` is a non-null ISO string. This proves the deku-swarm contract end to end.

Also grep `source/spec` for other exact-equality assertions on job payloads (e.g. `jobClass:` in expected objects) and add `endedAt` where needed.

## Files to Change

- `source/spec/lib/serializers/JobIndexSerializer_spec.js` — new `endedAt` cases and updated expectations.
- `source/spec/lib/serializers/JobShowSerializer_spec.js` — new `endedAt` cases and updated expectations.
- `source/spec/lib/serializers/JobShowSerializer_dead_spec.js` — `endedAt` for a dead job.
- `source/spec/lib/serializers/JobSerializer_spec.js` — pass-through for both views.
- `source/spec/lib/server/handlers/jobs/JobsHandler_spec.js` — expected payloads and a finished-job case.
- `source/spec/lib/server/handlers/jobs/JobHandler_spec.js` — expected payloads and a finished-job case.
