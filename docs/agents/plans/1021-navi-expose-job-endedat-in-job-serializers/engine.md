# Engine Plan: Navi: expose Job#endedAt in job serializers

Main plan: [plan.md](plan.md)

## Shared contracts

The engine **produces** `endedAt: string | null` on every job object returned by `JobIndexSerializer` and `JobShowSerializer` (and so by `JobSerializer` for both views):

- `job.endedAt` is a number → `new Date(job.endedAt).toISOString()`;
- `job.endedAt` is `null` or `undefined` → `null` (never `"Invalid Date"`, never a throw).

The key is always present, not gated by status.

## Steps

- [01 — Add endedAt to the job serializers](engine/01-serializers.md)
- [02 — Cover endedAt in serializer and handler specs](engine/02-specs.md)
- [03 — Document endedAt in web-server.md](engine/03-docs.md)

## CI Checks

- `source`: `cd source && npm test && npm run lint` (CI jobs: `jasmine`, `checks`)

## Notes

- Do not touch `deku-swarm/` (`Job#endedAt` is consumed as is, from #1006).
- A small shared helper (e.g. a private static `#serializeEndedAt(job)` or a module-level function) can be reused by both serializers. Keep it inside `source/lib/serializers/` and avoid duplication flagged by `jscpd`.
- Run `npm run docs` only if the repo commits generated JSDoc under `source/docs/` for these serializers. Follow existing practice there.
