/**
 * UrlTokenResolver resolves the flat `{:key}` placeholder tokens shared by both
 * `ResourceRequest#resolveUrl` and `ResourceRequestEmit#resolveUrl`.
 * @author darthjee
 */
class UrlTokenResolver {
  /**
   * Returns the given URL with every `{:key}` token replaced by the corresponding value
   * from the parameters object. Tokens with no matching key are left unchanged.
   * @param {string} url The URL template to resolve.
   * @param {object} [parameters={}] Key-value map of URL parameters.
   * @returns {string} The resolved URL.
   */
  static resolve(url, parameters = {}) {
    return url.replace(/\{:(\w+)\}/g, (_, key) => parameters[key] ?? `{:${key}}`);
  }
}

export { UrlTokenResolver };
