import { LogRegistry } from '../registry/LogRegistry.js';

/**
 * HtmlElementParser wraps a single parsed HTML element and extracts attribute values,
 * logging a warning when the requested attribute is absent.
 * @author darthjee
 */
class HtmlElementParser {
  #element;
  #selector;

  /**
   * @param {object} element A parsed HTML element with a `getAttribute` method.
   * @param {string} selector The CSS selector that matched this element (used in warning messages).
   */
  constructor(element, selector) {
    this.#element = element;
    this.#selector = selector;
  }

  /**
   * Returns the value of the named attribute, or `null` if the attribute is absent.
   * Logs a warning when the attribute is absent.
   * @param {string} attribute Attribute name to extract.
   * @returns {string|null} The attribute value, or `null` when absent.
   */
  getAttribute(attribute) {
    const value = this.#element.getAttribute(attribute);

    if (value === undefined || value === null) {
      LogRegistry.warn(`HtmlParser: element matched by "${this.#selector}" is missing attribute "${attribute}"`);
      return null;
    }

    return value;
  }
}

export { HtmlElementParser };
