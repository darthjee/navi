import { ValueExtractor } from './ValueExtractor.js';
import { ValueResolver } from './ValueResolver.js';

/**
 * ArrayValueResolver resolves zero or more values relative to a DOM container.
 * @author darthjee
 */
class ArrayValueResolver {
  /**
   * @param {object} [config] The array-resolution configuration.
   * @param {string} [config.selector] A selector relative to the container. A
   * falsy selector resolves the container itself through {@link ValueResolver}.
   * @param {string} [config.attribute] The attribute to read instead of text content.
   * @param {boolean} [config.trim=true] Whether to trim non-null values.
   */
  constructor({ selector, attribute, trim = true } = {}) {
    this.selector = selector;
    this.attribute = attribute;
    this.trim = trim;
  }

  /**
   * Resolves an array of values from the given container.
   * @param {HTMLElement} element The container to resolve against.
   * @returns {Array<string|null>} The resolved values, or an empty array when no value exists.
   */
  resolve(element) {
    if (!this.selector) {
      const value = new ValueResolver({
        attribute: this.attribute,
        trim: this.trim,
      }).resolve(element);

      return value === null ? [] : [value];
    }

    return element.querySelectorAll(this.selector).map((target) => (
      new ValueExtractor(this.attribute, this.trim).extract(target)
    ));
  }
}

export { ArrayValueResolver };
