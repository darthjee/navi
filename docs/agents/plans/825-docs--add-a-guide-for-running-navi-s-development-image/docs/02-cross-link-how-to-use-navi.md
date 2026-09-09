# Cross-link from how_to_use_navi.md

Add an entry for the new guide in `docs/guides/how_to_use_navi.md`'s Table of Contents, positioned right after the existing Option D line:

```markdown
- [Option E — Development image](./navi/option-e-development-image.md) — Running Navi's own `navi:dev` image locally to try it out or develop against it, without a production build.
```

Do not fold it into the "Four integration modes are covered" bullet list above the Table of Contents — Options A–D are CI/production integration modes, and the dev image is a separate local trial/dev path. Instead, add a short standalone sentence after that list (or immediately before the Table of Contents) pointing to it, e.g. "To try Navi locally without any of the above, see Option E — Development image." Word it to fit the surrounding prose naturally.

## Files to Change

- `docs/guides/how_to_use_navi.md` — add the Table of Contents entry and the short pointer sentence described above.
