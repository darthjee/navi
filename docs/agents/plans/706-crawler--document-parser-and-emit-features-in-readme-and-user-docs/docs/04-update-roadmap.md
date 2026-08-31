# Update the Roadmap section

`README.md`'s `## Roadmap` (`README.md:457-461`) currently only lists `WorkersFactory` as planned-but-not-implemented; the crawler feature isn't mentioned there at all (it was never added as a Roadmap item), so there's no crawler bullet to remove. Instead:

- Confirm no other part of the Roadmap section (or any other README section) still frames `parser`/`emit`/crawling as a future/planned capability. If found, reword or remove it to reflect that the feature has shipped.
- No structural change is needed to the `## Roadmap` heading or the `WorkersFactory` bullet itself — leave both as-is.

## Files to Change

- `README.md` — verify/fix any stale "planned" framing of the crawler feature; no changes expected to the `WorkersFactory` roadmap bullet.
