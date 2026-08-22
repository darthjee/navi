# Collections

`JobRegistry` and `WorkersRegistry` are built on top of three small, general-purpose collection classes. Most consumers never touch this layer directly — the registries cover everything a typical `deku-swarm` user needs. They're exported (and documented here) for advanced use cases, such as building a custom registry of your own around the same primitives.

## `Queue`

A plain FIFO (first-in, first-out) collection.

```js
import { Queue } from 'deku-swarm';

const queue = new Queue();
queue.push('a');
queue.push('b');
queue.pick(); // => 'a'
queue.size(); // => 1
```

| Method | Description |
|--------|-------------|
| `push(item)` | Adds an item to the end of the queue. |
| `pick()` | Removes and returns the item at the front of the queue, or `undefined` if empty. |
| `size()` | Number of items currently queued. |
| `list()` | A shallow copy of every item, in FIFO order. |

This is the simplest of the three, and what backs `JobRegistry`'s `enqueued` and `retryQueue` collections (see [Job Lifecycle](./job-lifecycle.md)).

## `IdentifyableCollection`

A collection keyed by each item's own `id` property, giving O(1) lookup, insertion, and removal by id.

```js
import { IdentifyableCollection } from 'deku-swarm';

const collection = new IdentifyableCollection();
collection.push({ id: 'w1', name: 'worker one' });
collection.get('w1');    // => { id: 'w1', name: 'worker one' }
collection.has('w1');    // => true
collection.remove('w1');
collection.has('w1');    // => false
```

| Method | Description |
|--------|-------------|
| `push(item)` | Adds an item, keyed by `item.id`. |
| `remove(id)` | Removes the item with the given id, if present. |
| `get(id)` | Returns the item with the given id, or `undefined`. |
| `has(id)` | Whether an item with the given id exists. |
| `findById(id)` | Same lookup as `get`, but returns `null` instead of `undefined` when missing. |
| `byIndex(index)` | Returns the item at the given position in insertion order. |
| `list()` | All items, as an array. |
| `size()` | Number of items. |

This is what backs `WorkersRegistry`'s `workers`/`busy`/`idle` collections, and `JobRegistry`'s `processing`/`finished`/`dead` collections — anywhere the registries need to fetch or remove one specific job or worker by id.

## `SortedCollection`

A collection kept in order by a `sortBy` function you supply, with range queries backed by binary search. New items are buffered and only sorted/merged lazily, on the next read — cheap to push into, with sorting cost paid once per batch of reads rather than on every insert.

```js
import { SortedCollection } from 'deku-swarm';

const events = new SortedCollection([], { sortBy: (event) => event.at });

events.push({ at: 300, label: 'c' });
events.push({ at: 100, label: 'a' });
events.push({ at: 200, label: 'b' });

events.list();     // => [a, b, c] (sorted by `at`)
events.upTo(200);   // => [a, b] — items with `at` <= 200
events.after(200);  // => [c]     — items with `at` > 200
```

| Method | Description |
|--------|-------------|
| `push(item)` | Adds an item to the pending buffer. |
| `list()` | All items, sorted. |
| `size()` | Total number of items (sorted + pending). |
| `select(fn)` | Items for which the predicate `fn(item)` is truthy. |
| `upTo(value)` | Items whose sort value is `<= value`. |
| `after(value)` | Items whose sort value is `> value`. |
| `from(value)` | Items whose sort value is `>= value`. |
| `before(value)` | Items whose sort value is `< value`. |

This backs `JobRegistry`'s `failed` collection, sorted by each job's `readyBy` cooldown timestamp — `promoteReadyJobs()` (see [Job Lifecycle](./job-lifecycle.md)) uses `upTo(now)`/`after(now)` to split ready-vs-still-cooling jobs without scanning every failed job on every tick.

## `IdGenerator` vs. `UUidGenerator`

`worker/lib/generators/` isn't re-exported from `deku-swarm`'s public API, but it's worth understanding since factories (`JobFactory`/`WorkerFactory`, see [Setup](./setup.md)) use it by default: `IdGenerator` fills a build's `attributes.id` with a unique value if one isn't already given, delegating the actual uniqueness guarantee to `UUidGenerator` (backed by `crypto.randomUUID()` and a set of previously-seen ids, retrying on collision). Every job and worker `deku-swarm` builds for you gets a unique id this way by default — you only need to think about ids yourself if you're passing your own (e.g. a deterministic id for a job you want to look up later via `JobRegistry.jobById(id)`), in which case simply pass `{ id: 'your-value', ...otherParams }` when enqueuing and it's respected instead of generated.

[← Back to How to Use deku-swarm](../HOW_TO_USE_DEKU_SWARM.md)
