/**
 * TokenResolver resolves a dot-path token against a given item, used by
 * `ResourceRequestEmit`'s body template rendering pipeline.
 * @author darthjee
 */
class TokenResolver {
  /**
   * Resolves a dot-path token against the given item.
   * @param {string} path The dot-path to resolve, or "." for the whole item.
   * @param {*} item The item to resolve the path against.
   * @returns {*} The resolved value, or undefined when the path can't be resolved.
   */
  static resolve(path, item) {
    if (path === '.') return item;

    return path.split('.').reduce((current, segment) => current?.[segment], item);
  }
}

export { TokenResolver };
