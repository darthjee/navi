# Add parameters example to cli-usage.md

Extend `cli-usage.md`'s `engine-start` example the same way as step 01, but
for the `-p`/`--payload` CLI form. Add a second `-a engine-start` invocation
directly after the existing one, e.g.:

```bash
navi-client -b http://localhost:3000 -t $NAVI_API_TOKEN -a engine-start \
  -p '{"targets":[{"namespace":"crawler","parameters":{"region":"eu"},"resources":[{"name":"collection","parameters":{"slug":"tidal-aberrations"}}]}]}'
```

Add one short sentence noting the payload shape is identical to the library's
`engineStart(payload)` argument — no CLI-specific flag or parsing changed,
`--payload` is passed straight through as the request body, same as it does
today for the bare-string form.

## Files to Change

- `docs/guides/navi-client/cli-usage.md` — add the second `-a engine-start`
  example and one-sentence note described above, directly under the existing
  `engine-start` example block (before the `--file`/`--json`/`--yaml` section,
  which is unrelated to this feature).
