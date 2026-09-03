# Add MemoryDataSerializer

Create `source/lib/serializers/MemoryDataSerializer.js`, mirroring
`source/lib/serializers/LogSerializer.js` (~7-line `_serializeObject`):

```js
import { Serializer } from './Serializer.js';

class MemoryDataSerializer extends Serializer {
  static _serializeObject(entry) {
    return {
      id: entry.id,
      value: entry.value,
      percentage: entry.percentage,
      timestamp: entry.timestamp.toISOString(),
    };
  }
}

export { MemoryDataSerializer };
```

`entry` is a `MemoryData` instance (`source/lib/utils/memory/MemoryData.js`);
its `.timestamp` getter returns a `Date`, hence `.toISOString()` — do not call
`MemoryData.toJSON()` here, read the getters directly, same as `LogSerializer`
reads `log.timestamp` directly rather than calling `Log.toJSON()`.

Add doc comments matching `LogSerializer.js`'s style (`@augments Serializer`,
`@author darthjee`, `@param`/`@returns` on `_serializeObject`).

## Files to Change

- `source/lib/serializers/MemoryDataSerializer.js` — new file, as above.
- `source/spec/lib/serializers/MemoryDataSerializer_spec.js` — new spec,
  copying `source/spec/lib/serializers/LogSerializer_spec.js`'s structure
  (`.serialize` with a single entry, an array of entries, and an empty
  array; assert `timestamp` serializes to a string). Use a `makeEntry`
  helper building a plain object with `id`, `value`, `percentage`, and a
  fixed `timestamp` Date, e.g.:

  ```js
  const timestamp = new Date('2026-04-29T12:00:00.000Z');
  const makeEntry = (overrides = {}) => ({
    id: 1,
    value: 123456,
    percentage: 42.5,
    timestamp,
    ...overrides,
  });
  ```
