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
   * @param {object} [condition.equals_field] An optional `{ selector, attribute, trim }`
   * config resolved relative to the same container. When present (neither `null` nor
   * `undefined`), the resolved left value is compared for strict equality against this
   * second resolution instead of `equals`, so `equals_field` takes precedence over
   * `equals`. An `equals_field` of `null` falls back to literal `equals` mode, a
   * deliberate divergence from `json_path/ConditionMatcher`'s `!== undefined` guard.
   */
  constructor({
    selector, attribute, trim, equals, equals_field: equalsField,
  }) {
    this.selector = selector;
    this.attribute = attribute;
    this.trim = trim;
    this.equals = equals;
    this.equalsField = equalsField;
  }

  /**
   * Evaluates this condition against the given container.
   * @param {HTMLElement} container The DOM container to evaluate.
   * @returns {boolean} `true` when the resolved left value strictly equals the
   * `equals_field` resolution (when present) or the literal `equals` otherwise.
   */
  matches(container) {
    const left = new ValueResolver({
      selector: this.selector,
      attribute: this.attribute,
      trim: this.trim,
    }).resolve(container);

    if (this.equalsField !== null && this.equalsField !== undefined) {
      const right = new ValueResolver(this.equalsField).resolve(container);
      return left === right;
    }

    return left === this.equals;
  }
}

export { ConditionMatcher };
