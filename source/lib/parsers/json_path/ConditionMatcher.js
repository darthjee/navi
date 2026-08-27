/**
 * ConditionMatcher evaluates a single filter condition (`{ field, equals }` or
 * `{ field, equals_field }`) against an item, used by {@link FilterMatcher}.
 * @author darthjee
 */
class ConditionMatcher {
  /**
   * @param {object} condition The condition to evaluate.
   * @param {string} condition.field The item key whose value is compared.
   * @param {*} [condition.equals] The literal value `field` must equal, when
   * `equals_field` is absent.
   * @param {string} [condition.equals_field] Another item key `field`'s value must
   * equal, read from the same item.
   */
  constructor({ field, equals, equals_field: equalsField }) {
    this.field = field;
    this.equals = equals;
    this.equalsField = equalsField;
  }

  /**
   * Evaluates this condition against the given item.
   * @param {object} item The item to evaluate the condition against.
   * @returns {boolean} `true` when the item satisfies the condition.
   */
  matches(item) {
    if (this.equalsField !== undefined) return item[this.field] === item[this.equalsField];

    return item[this.field] === this.equals;
  }
}

export { ConditionMatcher };
