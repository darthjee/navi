# Parameter-aware token resolution on ResourceRequest

Add `hasUnresolvedTokens(parameters = {})` to `ResourceRequest`, alongside the
existing zero-arg `needsParams()` (left untouched, still used by every
parameter-blind enqueue path). The new method returns `true` when `this.url`
contains at least one `{:key}` token whose `key` is **absent or `null`** in
`parameters`. An **empty string is a present value** and does not count as
unresolved — `hasUnresolvedTokens({ slug: '' })` on a `/bundle/{:slug}/` request
is `false`. Extra keys in `parameters` with no matching token are irrelevant to
this check (it only inspects the tokens the URL actually declares).

Implement it by reusing the same token-matching regex `needsParams()` already
uses (`/\{:\w+\}/`), extracting each token's key and checking it against
`parameters` with `Object.prototype.hasOwnProperty`/`!= null` semantics — do not
reuse `UrlTokenResolver.resolve()` for this (that method silently leaves
unresolved tokens in place; this method needs a boolean, not a string).

## Files to Change

- `source/lib/models/request/resource_request/ResourceRequest.js` — add
  `hasUnresolvedTokens(parameters = {})`, documented with the same JSDoc style
  as the neighboring `resolveUrl`/`needsParams` methods.
- `source/spec/lib/models/request/resource_request/ResourceRequest_spec.js` —
  cover: no tokens (always `false`); one token present as a non-empty string
  (`false`); one token present as an empty string (`false`); one token present as
  a number/boolean (`false`); one token absent (`true`); one token explicitly
  `null` (`true`); multiple tokens, one satisfied one not (`true`); extra
  unrelated keys in `parameters` don't affect the result.
