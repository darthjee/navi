# Map-backed IdentifyableCollection and Job#endedAt

Make "oldest first" reliable and give terminal jobs a timestamp.

- `IdentifyableCollection`: replace the plain-object `#items` with a `Map`, preserving insertion order for every key type (integer-like ids iterate numerically first in plain objects). The constructor still accepts a plain object of initial items (convert with `Object.entries`); also accept a `Map`. Keep every public method's behaviour. Add an internal-use way to iterate/remove the oldest entries cheaply (e.g. a `keys()`/`shift()`-style helper or reuse `list()` + `remove()`), documented with JSDoc.
- `Job`: add a private `#endedAt = null`, a read-only `endedAt` getter, and methods for the registry to mark/reset it (e.g. `markEnded(now = Date.now())` and `clearEnded()`), with JSDoc.

## Files to Change
- `deku-swarm/lib/collections/IdentifyableCollection.js` — Map storage, oldest-entry helper.
- `deku-swarm/lib/background/Job.js` — `endedAt` getter and mark/reset methods.
