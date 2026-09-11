# Add a new parameterized-enqueue sample

Add a new sample file, `docs/guides/navi-client/samples/parameterized-enqueue.md`,
mirroring the structure and tone of the existing samples in that folder
(`push-config-and-start.md` and `error-handling.md` are the closest models:
`# Title`, `## Scenario`, `## Code`, `## What happens`, `## Notes`, and the
`[← Back to Samples](../samples.md)` footer).

Use the crawler-collection use case from #828's own description as the
scenario: an already-defined `crawler` namespace with a `collection` resource
whose `url` has a `{:slug}` (and optionally `{:region}`) placeholder; the
sample runs it against a specific collection URL/slug chosen at call time,
without pushing a one-off resource via `config()`. Example code shape:

```js
import { NaviClient } from 'navi-hey-client';

const client = new NaviClient({
  baseUrl: 'https://navi.internal.example.com',
  token: process.env.NAVI_API_TOKEN,
});

await client.engineStart({
  targets: [
    {
      namespace: 'crawler',
      parameters: { region: 'eu' },
      resources: [
        { name: 'collection', parameters: { slug: 'tidal-aberrations' } },
      ],
    },
  ],
});
```

`## What happens` should walk through: the target-level `parameters` default,
the per-resource override merging over it (per-resource wins on key conflict),
and that the resource must already exist (defined via `config()` beforehand or
at boot) — this call only supplies values, it does not define the resource.
`## Notes` should link to `library-usage.md`/`cli-usage.md` (method/flag
reference) and `../reference.md` (full request/response shape, already updated
by #829) — the same cross-linking pattern `push-config-and-start.md` already
uses in its own `## Notes`.

Add one new bullet to `docs/guides/navi-client/samples.md`'s list, in the same
one-line format as the existing four entries, pointing at the new file.

## Files to Change

- `docs/guides/navi-client/samples/parameterized-enqueue.md` — new file, per
  the shape above.
- `docs/guides/navi-client/samples.md` — add one bullet linking the new sample.
