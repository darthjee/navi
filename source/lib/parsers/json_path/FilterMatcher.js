import { ConditionMatcher } from './ConditionMatcher.js';

/**
 * FilterMatcher evaluates a parser's `filter` (a list of AND'ed conditions)
 * against an item, used by {@link JsonPathParser#extract}.
 * @author darthjee
 */
class FilterMatcher {
  /**
   * @param {Array<object>} [filter] The list of AND'ed conditions an item must satisfy,
   * or `undefined` when no filtering is required.
   */
  constructor(filter) {
    this.filter = filter;
  }

  /**
   * Evaluates this matcher's `filter` against the given item.
   * @param {object} item The item to evaluate the filter against.
   * @returns {boolean} `true` when `filter` is absent, or when every one of its
   * conditions matches the item.
   */
  matches(item) {
    if (!this.filter) return true;

    return this.filter.every((condition) => new ConditionMatcher(condition).matches(item));
  }
}

export { FilterMatcher };
