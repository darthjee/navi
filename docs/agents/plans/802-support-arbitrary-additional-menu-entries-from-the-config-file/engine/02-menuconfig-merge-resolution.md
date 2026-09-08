# MenuConfig: hidden, reposition, first-wins de-dup

Replace the current `#buildEntries` (which just validates and maps every raw
entry) with the full SPEC-2 resolution pipeline, operating on **validated raw
entry objects** and emitting `MenuEntry[]` at the very end.

Algorithm, in order:

1. **Validate** each raw entry as today (`MenuEntry.validate`); a failing entry
   is dropped with the existing `Logger.warn`
   (`[menu] skipping invalid entry at index <raw-index>: <reason>`) — keep the
   raw `entries`-array index here, unchanged.
2. **Partition `hidden`.** For each surviving raw entry with `hidden === true`:
   - `route` ∈ `DEFAULT_ROUTES` → record that route as suppressed; the entry
     itself does not render.
   - `route` ∉ `DEFAULT_ROUTES` → drop it with a `Logger.warn`
     (`[menu] skipping entry at index <raw-index>: "hidden" is only valid on a default route`).
   - Entries with `hidden` absent or `false` are normal visible entries.
3. **Default block.** Start from the shipped default block from step 01 (empty if
   `defaults: false`). Remove any default whose `route` is either suppressed
   (2) or re-listed by a visible custom entry (a custom entry whose `route` ∈
   `DEFAULT_ROUTES`).
4. **Custom block.** The visible custom entries in file order. For a custom entry
   whose `route` ∈ `DEFAULT_ROUTES` (a reposition): use its `text` when supplied,
   otherwise the shipped default label from step 01 (`Logs` / `Memory`) — *not*
   the route. Non-default custom entries keep `MenuEntry`'s existing
   `text ?? route` defaulting.
5. **Merge:** `merged = [...defaultBlock, ...customBlock]`.
6. **First-wins de-dup** over `merged` in order. Track seen `route`s with the
   index at which each was first kept. On a later entry whose `route` is already
   seen, drop it and `Logger.warn`
   (`[menu] skipping duplicate entry at index <i>: route "<route>" already defined at index <j>`)
   where `<i>` / `<j>` are positions in the **merged render-order list**, not the
   raw file. A single re-listed default is *not* a duplicate — step 3 already
   removed it from the default block, so only a genuine repeat (e.g. `defaults:
   false` plus two `/logs` entries, or two custom `/dashboard` entries) triggers
   this.
7. Return the survivors as `MenuEntry` instances (`MenuEntry.fromObject`, which
   step 03 makes label-aware where needed).

Text-collision on a different `route` is intentionally *not* handled — it is
allowed and silent.

## Files to Change

- `source/lib/models/configs/MenuConfig.js` — replace `#buildEntries` with the
  hidden/reposition/merge/de-dup pipeline above; add private helpers as needed
  (`#resolveHidden`, `#buildDefaultBlock`, `#dedupe`) keeping each small and
  single-purpose to satisfy `npm run report` (jscpd) and the repo style.
