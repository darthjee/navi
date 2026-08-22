/**
 * ClientReference parses the raw client reference shape shared by `ResourceRequest`'s
 * top-level `client:` field and `ResourceRequestEmit`'s `emit.client` field, since both
 * accept the exact same two forms: a bare name string, or a `{name, namespace}` object.
 * @author darthjee
 */
class ClientReference {
  /**
   * Parses a raw client reference into a name/namespace pair.
   * Accepts either a bare string (shorthand, resolved in the requester's own namespace)
   * or an object with an explicit target `namespace`.
   * @param {string|{name: string, namespace: string}} [client] The raw client reference.
   * @returns {{name: string|undefined, namespace: string|null}} The parsed client name and target namespace.
   */
  static parse(client) {
    if (client && typeof client === 'object') {
      return { name: client.name, namespace: client.namespace ?? null };
    }
    return { name: client, namespace: null };
  }
}

export { ClientReference };
