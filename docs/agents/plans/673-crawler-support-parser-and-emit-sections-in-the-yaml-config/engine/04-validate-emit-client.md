# Validate emit.client in NamespaceMapBuilder

Extend `NamespaceMapBuilder#validateReferences` (and a new `#validateEmitClient`, mirroring the existing `#validateClient`) to also resolve `resourceRequest.emit`'s client reference when `emit` is present, using the same `namespaceMap.getClient(namespace, name, targetNamespace)` call `#validateClient` already makes for the top-level `client:` field. An unresolvable `emit.client` throws `ClientNotFound`, identical to today's top-level client validation — no new exception type needed here, since `ClientNotFound` is already reference-agnostic (it just names the missing client).

This validation only runs when `emit` is present on the `ResourceRequest` (mirrors how `#validateClient` short-circuits when `clientName` is falsy) — resources without `emit` are completely unaffected, preserving backward compatibility.

## Files to Change

- `source/lib/services/NamespaceMapBuilder.js` — add `#validateEmitClient`, call it from `#validateReferences` alongside the existing `#validateClient`/`#validateActions` calls.
