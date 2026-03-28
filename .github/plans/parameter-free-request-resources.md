# Plan: Initial Enqueueing of Parameter-Free ResourceRequests

## Objective

Enable the application to enqueue all `ResourceRequest` instances that do **not** require parameters (i.e., their URL templates contain no `{:placeholder}` tokens) at startup.

## Steps

### 1. Add a Method to `ResourceRequest`

- **Method:** `needsParams()`
- **Responsibility:** Returns `true` if the URL template contains any `{:placeholder}` tokens, otherwise `false`.
- **Scenarios to Test:**
  - URL with no placeholders (e.g., `/categories.json`) → returns `false`
  - URL with one or more placeholders (e.g., `/categories/{:id}.json`) → returns `true`
  - URL with multiple placeholders (e.g., `/categories/{:id}/items/{:item_id}`) → returns `true`
  - Edge cases: empty URL, malformed placeholders, etc.

- **Documentation:**  
  JSDoc for `needsParams()` describing its logic and return value.

### 2. Create a Collector Class

- **Class:** `ResourceRequestCollector`
- **Constructor:** Receives a `ResourceRegistry` instance.
- **Method:** `allRequests()`
  - Returns a flat array of all `ResourceRequest` instances from all resources.
- **Method:** `requestsNeedingNoParams()`
  - Returns only those `ResourceRequest` instances for which `needsParams()` returns `false`.
  - Uses `NamedRegistry#filter` to help filter resources if needed.

- **Scenarios to Test:**
  - Registry with multiple resources, some with parameterized requests, some without.
  - Registry with no resources.
  - Registry where all requests need parameters.
  - Registry where no requests need parameters.

- **Documentation:**  
  JSDoc for the class and all public methods.

### 3. Testing

- **Location:** `spec/lib/registry/ResourceRequestCollector_spec.js`
- **Coverage:**
  - All scenarios above for both `needsParams()` and collector methods.
  - Edge cases: empty registry, resources with empty request lists, malformed URLs.

### 4. Usage Example

- Show how to use `ResourceRequestCollector` to get all parameter-free requests for initial enqueueing.

---

## Implementation Guidelines

- Follow project code style and documentation standards.
- All code, comments, and documentation must be in English.
- Use ES Modules and `.js` extensions.
- Add JSDoc for all new classes and methods.
- Ensure 100% test coverage for new logic.

---

## Deliverables

- `ResourceRequest#needsParams()` method with tests and documentation.
- `ResourceRequestCollector` class with tests and documentation.
- Usage example in documentation or as a code comment.