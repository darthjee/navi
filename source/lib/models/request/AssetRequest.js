/**
 * AssetRequest represents a CSS-selector-based extraction rule for asset URLs from an HTML response.
 * @author darthjee
 */
class AssetRequest {
  /**
   * @param {object} attributes AssetRequest attributes.
   * @param {string} attributes.selector CSS selector used to find asset elements.
   * @param {string} attributes.attribute Attribute on the matched element holding the asset URL.
   * @param {string} [attributes.client] Named client to use when fetching the asset.
   * @param {number} [attributes.status=200] Expected HTTP status code for asset fetches.
   */
  constructor({ selector, attribute, client, status = 200 }) {
    this.selector = selector;
    this.attribute = attribute;
    this.client = client;
    this.status = status;
  }

  /**
   * Creates an AssetRequest instance from a plain config object.
   * @param {object} obj Raw config object.
   * @returns {AssetRequest} A new AssetRequest instance.
   */
  static fromObject(obj) {
    return new AssetRequest(obj);
  }

  /**
   * Creates a list of AssetRequest instances from an array of plain config objects.
   * @param {Array<object>} [list=[]] Array of raw config objects.
   * @returns {Array<AssetRequest>} List of AssetRequest instances.
   */
  static fromListObject(list = []) {
    return list.map((obj) => AssetRequest.fromObject(obj));
  }
}

export { AssetRequest };
