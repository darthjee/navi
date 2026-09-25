# Move the namespace resolution block to its own spec and trim the main spec
Create `ResourceRequestPaginatedAction_namespace_spec.js` next to the existing spec. Move the whole `describe('namespace resolution', ...)` block into it, with all four `it` cases unchanged. Use the same `describe('ResourceRequestPaginatedAction')` → `describe('#execute')` wrapper and the same `ResourceActionUtils.setup()` call as in step 02. It needs `JobRegistry`, `NamespaceNotFound`, `ResourceRequestPaginatedAction`, `ResourceRequestFactory`, `ResourceActionUtils` and `PaginatedActionSpecUtils`.

Remove the block from `ResourceRequestPaginatedAction_spec.js`. Then remove any imports the main spec no longer uses, such as `NamespaceNotFound`, so `yarn lint` stays clean. Confirm that all three files are under 300 lines and that the total spec count matches the count before the split.

## Files to Change
- `source/spec/lib/models/request/resource_request/ResourceRequestPaginatedAction_namespace_spec.js`: new file.
- `source/spec/lib/models/request/resource_request/ResourceRequestPaginatedAction_spec.js`: remove the `namespace resolution` block and unused imports.
