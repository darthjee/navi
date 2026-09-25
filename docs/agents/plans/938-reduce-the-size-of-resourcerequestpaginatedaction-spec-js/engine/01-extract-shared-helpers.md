# Extract shared paginated-action spec helpers
Create `source/spec/support/utils/PaginatedActionSpecUtils.js`. It holds what the three spec files share. Follow the static-class style of `ResourceActionUtils` and `PaginatedActionEnqueuerUtils`, including JSDoc on each member:

- `PaginatedActionSpecUtils.pagination`: the `[{ pages: 'parsedBody.total_pages', page_key: 'page' }]` config.
- `PaginatedActionSpecUtils.responseWrapper`: the `{ parsedBody: { total_pages: 3 }, headers: {}, parameters: {} }` wrapper.
- `PaginatedActionSpecUtils.registerProductsResource(...resourceRequests)`: delegates to `ResourceActionUtils.registerResource('products', resourceRequests)`.

Return fresh objects from static getters or methods, so a spec cannot mutate state that another spec relies on. Then update the existing spec to use the util instead of its local constants and helper. The simplest way is to destructure them once at the top of the file, which keeps the test bodies unchanged.

## Files to Change
- `source/spec/support/utils/PaginatedActionSpecUtils.js`: new support util.
- `source/spec/lib/models/request/resource_request/ResourceRequestPaginatedAction_spec.js`: remove the local `pagination`, `responseWrapper` and `registerProductsResource`, and import them from the new util.
