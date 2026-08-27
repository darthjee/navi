import { ConditionMatcher } from './ConditionMatcher.js';

/**
 * FilterMatcher evaluates a list of AND'ed CSS parser conditions against a DOM
 * container.
 * @author darthjee
 */
class FilterMatcher {
  /**
   * @param {Array<object>} [filter] The list of conditions every container must satisfy.
   */
  constructor(filter) {
    this.filter = filter;
  }

  /**
   * Evaluates this matcher's filter against the given container.
   * @param {HTMLElement} container The DOM container to evaluate.
   * @returns {boolean} `true` when no filter is present or every condition matches.
   */
  matches(container) {
    if (!this.filter) return true;

    return this.filter.every((condition) => new ConditionMatcher(condition).matches(container));
  }
}

export { FilterMatcher };
