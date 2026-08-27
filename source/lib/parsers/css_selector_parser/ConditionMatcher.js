import { ValueResolver } from './ValueResolver.js';

/**
 * ConditionMatcher evaluates one CSS parser filter condition against a DOM
 * container.
 * @author darthjee
 */
class ConditionMatcher {
  /**
   * @param {object} condition The condition to evaluate.
   * @param {string} [condition.selector] A selector relative to the container.
   * @param {string} [condition.attribute] The attribute to read instead of text content.
   * @param {boolean} [condition.trim=true] Whether to trim the resolved value.
   * @param {*} [condition.equals] The literal value the resolved value must equal.
   */
  constructor({ selector, attribute, trim, equals }) {
    this.selector = selector;
    this.attribute = attribute;
    this.trim = trim;
    this.equals = equals;
  }

  /**
   * Evaluates this condition against the given container.
   * @param {HTMLElement} container The DOM container to evaluate.
   * @returns {boolean} `true` when the resolved value strictly equals `equals`.
   */
  matches(container) {
    const value = new ValueResolver({
      selector: this.selector,
      attribute: this.attribute,
      trim: this.trim,
    }).resolve(container);

    return value === this.equals;
  }
}

export { ConditionMatcher };
