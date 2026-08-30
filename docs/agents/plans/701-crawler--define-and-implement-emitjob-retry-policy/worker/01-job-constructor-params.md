# Thread maxRetries/cooldown through Job's constructor

`Job` gains optional constructor params so a job instance can carry its own effective `maxRetries`/cooldown, distinct from both the base class's hardcoded default and the registry's global config. Must stay fully backward compatible: `new Job({ id })` must keep behaving exactly as it does today.

- Constructor becomes `constructor({ id, maxRetries, cooldown } = {})`, storing `maxRetries`/`cooldown` in new private fields (e.g. `#maxRetries`, `#cooldown`).
- `get maxRetries()` returns `this.#maxRetries ?? 3` — preserves the documented "defaults to 3" contract when the param is omitted.
- New `get cooldown()` returns `this.#cooldown` as-is (may be `undefined` — `JobRegistryInstance` handles the fallback, see step 02).
- A subclass's own getter override (`ExtractionJob`, `HtmlParseJob`, etc.) is a full method override and is unaffected by this change — it wins regardless of what the constructor received.

## Files to Change

- `worker/lib/background/Job.js` — add the constructor params, private fields, and the new `cooldown` getter; update `maxRetries`'s implementation as above.
- `worker/README.md` (only if it documents `Job`'s constructor signature directly — check before editing; the fuller doc update lives with `docs`).
