# Register EmitJob in ApplicationInstance

`ApplicationInstance#initRegistries` (`source/lib/services/ApplicationInstance.js`, ~lines 325-335) registers every job class with `JobFactory.build(<key>, { klass, attributes })`, e.g.:

```js
JobFactory.build('ResourceRequestJob', { klass: ResourceRequestJob, attributes: { clients: this.config.namespaceMap } });
```

Add an analogous line for `EmitJob`, e.g.:

```js
JobFactory.build('Emit', { klass: EmitJob, attributes: { clients: this.config.namespaceMap } });
```

Import `EmitJob` from `../jobs/EmitJob.js` (or wherever the existing job imports are grouped in this file).

This is registration only — it makes `'Emit'` a buildable job key in the `JobFactory`. No caller enqueues it yet; that is #677's job (wiring `ExtractionJob` to enqueue one `EmitJob` per extracted item), explicitly out of scope here.

## Files to Change

- `source/lib/services/ApplicationInstance.js` — import `EmitJob`, add the `JobFactory.build('Emit', ...)` registration.
