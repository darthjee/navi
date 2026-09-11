# Add parameters example to library-usage.md and clients/node/README.md

Extend the existing `POST /api/engine/start` example and method reference in
`library-usage.md` (and the mirrored copy in `clients/node/README.md`) so a
reader sees the new `parameters` capability from #828/#829 alongside the
existing bare-string form, without losing that existing example.

Add a second `engineStart()` call directly under the current one (after the
`// POST /api/engine/start` block), showing a target-level `parameters`
default merged with a per-resource override, e.g.:

```js
// POST /api/engine/start — with per-request parameter values
await client.engineStart({
  targets: [
    {
      namespace: 'crawler',
      parameters: { region: 'eu' },
      resources: [{ name: 'collection', parameters: { slug: 'tidal-aberrations' } }],
    },
  ],
});
```

Follow it with one short paragraph (matching the file's existing prose style)
explaining: a `resources[]` entry may be a bare string (unchanged) or a
`{ name, parameters }` object; a target-level `parameters` default is
shallow-merged under any per-resource `parameters` (per-resource wins); no
client-side code changes were needed — the payload is forwarded to the engine
as-is. Link to `docs/agents/web-server.md#api-namespace` (already updated by
#829) for the full merge/validation rules, the same way the file already links
`reference.md` at the end of the `## NaviClient` section.

The method table itself (`| engineStart(payload = {}) | POST /api/engine/start |`)
does not need a wording change — the row already just names the route.

## Files to Change

- `docs/guides/navi-client/library-usage.md` — add the second `engineStart()`
  example and explanatory paragraph described above.
- `clients/node/README.md` — apply the identical addition; this file mirrors
  `library-usage.md`'s corresponding section verbatim today (see its own
  `## NaviClient` example block and table), so keep both in sync.
