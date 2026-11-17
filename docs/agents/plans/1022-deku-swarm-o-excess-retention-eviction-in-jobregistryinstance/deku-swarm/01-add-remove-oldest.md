# Add IdentifyableCollection#removeOldest

Add a public `removeOldest(n)` method to `IdentifyableCollection` (`deku-swarm/lib/collections/IdentifyableCollection.js`), with JSDoc in the same style as the other methods:

- If `n <= 0` (or the collection is empty), return `0` without iterating.
- Otherwise collect up to `n` ids from `this.#items.keys()` (insertion order) into an array, stopping once `n` ids are collected. **Do not** spread the whole iterator. Then delete each collected id from `#items`.
- Reset `this.#size = null` when anything was removed.
- Return the number of ids removed.

Specs in `deku-swarm/spec/collections/IdentifyableCollection_spec.js`, in a `describe('#removeOldest', ...)` block:

- `n <= 0` (try `0` and a negative number): returns `0` and leaves `list()` unchanged.
- `0 < n < size`: removes the first `n` in insertion order, `list()` keeps the rest in order, and it returns `n`.
- `n >= size`: removes everything and returns the original size, not `n`.
- Size cache: call `size()` **before** `removeOldest`, then assert `size()` after reflects the removal.
- Removed ids: `has(id)` is false and `get(id)` is `undefined`.
- Re-pushing an existing id keeps its original position, so that item is removed first.

Also add `removeOldest(n)` to the `IdentifyableCollection` method list in `docs/agents/deku-swarm.md` (around the "`IdentifyableCollection` — items keyed by `item.id`..." bullet).

## Files to Change
- `deku-swarm/lib/collections/IdentifyableCollection.js` — new `removeOldest(n)` method.
- `deku-swarm/spec/collections/IdentifyableCollection_spec.js` — specs for `removeOldest`.
- `docs/agents/deku-swarm.md` — list the new method.
