import { ValueExtractor } from './ValueExtractor.js';

/**
 * ValueResolver resolves one DOM element relative to a container and extracts
 * its configured value.
 * @author darthjee
 */
class ValueResolver {
  /**
   * @param {object} [config] The value-resolution configuration.
   * @param {string} [config.selector] A selector relative to the container. A
   * falsy selector uses the container itself.
   * @param {string} [config.attribute] The attribute to read instead of text content.
   * @param {boolean} [config.trim=true] Whether to trim non-null values.
   */
  constructor({ selector, attribute, trim = true } = {}) {
    this.selector = selector;
    this.attribute = attribute;
    this.trim = trim;
  }

  /**
   * Resolves and extracts a single value from the given container.
   * @param {HTMLElement} element The container to resolve against.
   * @returns {string|null} The resolved value, or `null` when the selector matches nothing.
   */
  resolve(element) {
    const target = this.selector ? element.querySelector(this.selector) : element;

    if (!target) return null;

    return new ValueExtractor(this.attribute, this.trim).extract(target);
  }
}

export { ValueResolver };
