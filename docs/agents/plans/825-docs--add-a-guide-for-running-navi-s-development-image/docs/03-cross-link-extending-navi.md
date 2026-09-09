# Cross-link from extending-navi.md

`docs/guides/navi/extending-navi.md` currently mentions the dev image only in passing (as the base the extension example mounts onto, via `navi_extensions_app`). Where it introduces/first references `navi_extensions_app` or the base image, add a link to the new guide, e.g.:

```markdown
See [Option E — Development image](./option-e-development-image.md) for how to run this image outside of the extensions workflow.
```

Place it near the existing mention rather than restructuring the page — this is a pointer, not new content.

## Files to Change

- `docs/guides/navi/extending-navi.md` — add the one-line cross-link described above near its existing dev-image/`navi_extensions_app` mention.
