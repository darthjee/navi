# Create ResourceRequest_url_spec.js
Move the `#resolveUrl`, `#needsParams` and `#hasUnresolvedTokens` describe blocks (lines 236–405) verbatim into a new file wrapped in `describe('ResourceRequest', ...)`. The only import needed is `ResourceRequestFactory`. No registry setup is required: these are pure methods.

## Files to Change
- `source/spec/lib/models/request/resource_request/ResourceRequest_url_spec.js` — new spec with the URL-handling blocks
