# Move the parameters block to its own spec
Create `ResourceRequestPaginatedAction_parameters_spec.js` next to the existing spec. Move the whole `describe('parameters', ...)` block into it, including its local `wrapper` and all five `it` cases, unchanged. Wrap it in `describe('ResourceRequestPaginatedAction')` → `describe('#execute')`, and call `ResourceActionUtils.setup()` in the outer describe. Import only what the block uses: `JobRegistry`, `MissingMappingVariable`, `ResourceRequestPaginatedAction`, `ResourceRequestFactory`, `ResourceActionUtils` and `PaginatedActionSpecUtils`.

Remove the block from `ResourceRequestPaginatedAction_spec.js`.

## Files to Change
- `source/spec/lib/models/request/resource_request/ResourceRequestPaginatedAction_parameters_spec.js`: new file.
- `source/spec/lib/models/request/resource_request/ResourceRequestPaginatedAction_spec.js`: remove the `parameters` block.
