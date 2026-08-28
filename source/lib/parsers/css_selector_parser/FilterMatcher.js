import { ConditionMatcher } from './ConditionMatcher.js';
import { Logger } from '../../utils/logging/Logger.js';

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

  /**
   * Scans the filter once and emits a single `Logger.warn` per condition that
   * carries both `equals` and `equals_field`, since `equals_field` silently wins
   * at match time. Meant to be called once per `extract()`, never per container.
   * @returns {void}
   */
  warnConflicts() {
    if (!this.filter) return;

    this.filter
      .filter((condition) => condition.equals !== undefined
        && condition.equals_field !== null && condition.equals_field !== undefined)
      .forEach((condition) => Logger.warn(
        `CssSelectorParser filter condition for selector "${condition.selector}" declares both `
        + 'equals and equals_field; equals_field takes precedence and equals is ignored.',
      ));
  }
}

export { FilterMatcher };
