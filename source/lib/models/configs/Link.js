/**
 * Represents a web link item configured for the UI.
 * @author darthjee
 */
class Link {
  /**
   * Creates a Link instance.
   * @param {object} params - Constructor params.
   * @param {string} params.url - Link URL.
   * @param {string} [params.text] - Link display text.
   */
  constructor({ url, text }) {
    this.url = url;
    this.text = text ?? url;
  }

  /**
   * Creates a Link instance from a YAML entry.
   * @param {string|object} entry - A URL string or an object with text/url fields.
   * @returns {Link} The parsed Link instance.
   */
  static fromObject(entry) {
    if (typeof entry === 'string') return new Link({ url: entry, text: entry });
    return new Link({ url: entry.url, text: entry.text });
  }

  /**
   * Serializes this link for JSON responses.
   * @returns {{url: string, text: string}} The serialized link.
   */
  toJSON() {
    return { url: this.url, text: this.text };
  }
}

export { Link };
