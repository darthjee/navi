# Issue: Allow config split

## Problem
Today Navi only supports a single, monolithic configuration file, parsed and stored in `Config` (`source/lib/models/configs/Config.js`). All `resources` and `clients` must be declared inline in that one file.

For large applications this becomes unwieldy: the config file grows very large and convoluted, mixing unrelated groups of resources and clients together with no way to organize or reuse them across files.

## Solution
Allow a configuration file to `include` other configuration files, and organize the resources/clients contributed by each file into a `namespace`.

### Namespaces
- A resource or client belongs to the `namespace` declared at the top of the file that defines it (`namespace: <name>` as a top-level key).
- A file that does not declare its own `namespace` is assumed to belong to the `default` namespace (this includes the main/entry config file unless it declares one itself).
- A resource can reference another resource, or a client, outside of its own namespace by adding a `namespace` key next to the reference.
- When a reference omits `namespace`, it is assumed to be in the same namespace as the resource making the reference.
- When a namespace lookup with an explicit namespace fails, or when no namespace is given and the lookup in the requester's own namespace fails, resolution falls back to the `default` namespace.
- Multiple included files may declare the same `namespace` name; their resources/clients are merged into that one namespace. A duplicate resource/client name within the same namespace (whether declared directly or merged in from another file) is an error.
- Unresolvable references (an explicit namespace that doesn't exist, or a name that isn't found even after falling back to `default`) are validated eagerly while the namespace map is being built from the config, so bad config is caught at load/startup time rather than later at request time.

### Included file location
- The path passed to `include` is relative to the location of the file that declares the `include`.
- A full/absolute path may also be given to `include`.

### Example
`config.yml` (entry point, no `namespace` declared -> `default`):
```yml
resources:
  people:
    - url: /people.json
      paginated_actions:
        - resource: paginated_people
          namespace: paginated
          pagination:
            - pages: parsedBody.pagination.pages
            - page_key: page
            - zero_indexed: false
  person:
    - url: /people/:id.json
      actions:
        - resource: items
          parameters:
            person_id: parsedBody.id
  items:
    - url: /people/:person_id/items.json
      paginated_actions:
        - resource: paginated_items
          namespace: paginated
          pagination:
            - pages: parsedBody.pagination.pages
            - page_key: page
            - zero_indexed: false
  item:
    - url: /people/:person_id/items/:id.json

include:
  - paginated_resources.yml
  - /full/path/to/clients.yml
```

`/full/path/to/clients.yml`:
```yml
namespace: clients
clients:
  non-default:
    base_url: https://example.com
    timeout: 5000
```

`paginated_resources.yml` (relative to `config.yml`'s directory):
```yml
namespace: paginated
resources:
  paginated_people:
    client:
      name: non-default
      namespace: clients
    - url: /people.json?page={page}
      actions:
        - resource: person
          namespace: default
          parameters:
            id: parsedBody.id
  paginated_items:
    - url: /people/:person_id/items.json?page={page}
      actions:
        - resource: item
          namespace: default
          parameters:
            id: parsedBody.id
            person_id: parsedBody.person_id
```

### Client and namespace
A client reference can be given with or without a namespace:
```yml
resources:
  some_resource:
    client:
      name: non-default
      namespace: clients
```
```yml
resources:
  some_resource:
    client:
      name: non-default # resolved in this resource's own namespace
```
```yml
resources:
  some_resource:
    client: non-default # shorthand, same as omitting namespace
```

### Implementation
- A class dedicated to, from an already-parsed config, generating a namespace with its resource and client configuration.
- A class dedicated to resolving `include`d configs into the namespace map.
- A class representing the namespace map, exposing:
  - a method to fetch a resource, given: the namespace of the original requester (the resource's own namespace on the initial run, or the triggering resource's namespace when called from another resource's action), the resource name, and the namespace of the desired resource (when `null`, use the requester's own namespace, falling back to `default` if not found there).
  - a method to fetch a client, with the same namespace-resolution rules as above, given the resource's namespace, the client name, and the desired namespace.
- A class representing a single namespace.
- `ResourceRegistry` is built and bound to a namespace; resources also carry their namespace name.
- `ClientRegistry` is built and bound to a namespace; clients also carry their namespace name.

## Benefits
- Large configurations can be split into smaller, focused files instead of one monolithic file.
- Resources and clients can be grouped and reused by namespace, reducing name collisions between unrelated groups.
- Existing single-file configurations keep working unchanged, implicitly living in the `default` namespace.
