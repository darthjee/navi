/**
 * ValueExtractor reads an attribute or text content from a DOM element and
 * applies the configured trimming behavior.
 * @author darthjee
 */
class ValueExtractor {
  /**
   * @param {string} [attribute] The attribute to read. Only `undefined` selects
   * text content; all other values are passed to `getAttribute`.
   * @param {boolean} [trim=true] Whether to trim non-null values.
   */
  constructor(attribute, trim = true) {
    this.attribute = attribute;
    this.trim = trim;
  }

  /**
   * Extracts a value from the given DOM element.
   * @param {HTMLElement} target The DOM element to read from.
   * @returns {string|null} The extracted value, or `null` when the attribute is absent.
   */
  extract(target) {
    const raw = this.attribute !== undefined
      ? target.getAttribute(this.attribute)
      : target.text;
    const value = raw === undefined ? null : raw;

    if (value !== null && this.trim !== false) return value.trim();

    return value;
  }
}

export { ValueExtractor };
