# Spec Factories

All factories live in `source/spec/support/factories/` and are test-only helpers.

---

## `ResourceRequestFactory`

**File:** `source/spec/support/factories/ResourceRequestFactory.js`

**Replaces:**
```javascript
new ResourceRequest({ url: '/categories.json', status: 200 })
new ResourceRequest({ url: '/categories/{:id}.json', status: 200 })
```

**Signature:**
```javascript
ResourceRequestFactory.build({ url, status, client, actions })
// url     — defaults to '/categories.json'
// status  — defaults to 200
// client  — optional
// actions — optional, defaults to []
```

**Spec files affected:** `Job_spec.js`, `Worker_spec.js`, `Resource_spec.js`, `ResourceRequest_spec.js`, `Client_spec.js`, `ConfigLoader_spec.js`, `ConfigParser_spec.js`, `Config_spec.js`, `JobRegistry_spec.js`, `JobFactory_spec.js`, `ResourceRequestCollector_spec.js`

---

## `ClientFactory`

**File:** `source/spec/support/factories/ClientFactory.js`

**Replaces:**
```javascript
new Client({ name: 'default', baseUrl: 'https://example.com' })
new Client({ name: 'other', baseUrl: 'https://other.com' })
```

**Signature:**
```javascript
ClientFactory.build({ name, baseUrl })
// name    — defaults to 'default'
// baseUrl — defaults to 'https://example.com'
```

**Spec files affected:** `Job_spec.js`, `Worker_spec.js`, `ClientRegistry_spec.js`, `Client_spec.js`, `Config_spec.js`, `ConfigLoader_spec.js`, `ConfigParser_spec.js`

---

## `ClientRegistryFactory`

**File:** `source/spec/support/factories/ClientRegistryFactory.js`

**Replaces:**
```javascript
const client = new Client({ name: 'default', baseUrl: 'https://example.com' });
new ClientRegistry({ default: client })
```

**Signature:**
```javascript
ClientRegistryFactory.build(clientsMap)
// clientsMap — optional object mapping names to Client instances
//              defaults to { default: ClientFactory.build() }
```

**Spec files affected:** `Job_spec.js`, `Worker_spec.js`, `ClientRegistry_spec.js`, `Config_spec.js`, `ConfigLoader_spec.js`, `ConfigParser_spec.js`, `JobFactory_spec.js`, `WorkerFactory_spec.js`, `WorkersAllocator_spec.js`

---

## `ResourceFactory`

**File:** `source/spec/support/factories/ResourceFactory.js`

**Replaces:**
```javascript
new Resource({ name: 'categories', resourceRequests: [request1, request2] })
```

**Signature:**
```javascript
ResourceFactory.build({ name, resourceRequests })
// name             — defaults to 'categories'
// resourceRequests — defaults to [ResourceRequestFactory.build()]
```

**Spec files affected:** `Config_spec.js`, `Resource_spec.js`, `ConfigLoader_spec.js`, `ConfigParser_spec.js`, `ResourceRequestCollector_spec.js`

---

## `JobRegistryFactory`

**File:** `source/spec/support/factories/JobRegistryFactory.js`

**Replaces:**
```javascript
const clients = new ClientRegistry({});
new JobRegistry({ clients })
```

**Signature:**
```javascript
JobRegistryFactory.build({ clients })
// clients — defaults to ClientRegistryFactory.build()
```

**Spec files affected:** `Worker_spec.js`, `WorkersRegistry_spec.js`, `WorkersAllocator_spec.js`, `Engine_spec.js`, `WorkerFactory_spec.js`, `JobRegistry_spec.js`

---

## `WorkersRegistryFactory`

**File:** `source/spec/support/factories/WorkersRegistryFactory.js`

**Replaces:**
```javascript
const clients  = new ClientRegistry({});
const jobRegistry = new JobRegistry({ clients });
const workers  = new IdentifyableCollection();
new WorkersRegistry({ jobRegistry, quantity: 1, workers })
```

**Signature:**
```javascript
WorkersRegistryFactory.build({ jobRegistry, quantity, workers })
// jobRegistry — defaults to JobRegistryFactory.build()
// quantity    — defaults to 1
// workers     — defaults to new IdentifyableCollection()
```

**Spec files affected:** `Worker_spec.js`, `WorkersRegistry_spec.js`, `WorkersAllocator_spec.js`, `Engine_spec.js`, `WorkerFactory_spec.js`
