/**
 * Stub builders used by ConditionMatcher specs.
 *
 * Elements are described declaratively (`{ attribute }`, `{ text }` or `null`) so
 * scenarios can be expressed as plain data and turned into stubs inside each `it`.
 */
class ConditionMatcherUtils {
  /**
   * Builds an element stub from a description.
   * @param {{ attribute: string }|{ text: string }|null} description - `{ attribute }` builds an
   *   element whose `getAttribute` spy returns the value, `{ text }` builds an element carrying
   *   that text, and `null` means the selector matches nothing.
   * @returns {object|null} The element stub, or null when no element is described.
   */
  static element(description) {
    if (description === null) {
      return null;
    }

    if ('attribute' in description) {
      return {
        getAttribute: jasmine.createSpy('getAttribute').and.returnValue(description.attribute),
      };
    }

    return { text: description.text };
  }

  /**
   * Builds a container stub whose `querySelector` spy resolves the primary element for
   * `primarySelector` and the canonical element for any other selector.
   * @param {object} elements - Elements returned by the container.
   * @param {{ attribute: string }|{ text: string }|null} elements.primary - Description of the primary element.
   * @param {{ attribute: string }|{ text: string }|null} elements.canonical - Description of the canonical element.
   * @param {object} [extra] - Extra properties merged into the container (e.g. `text`).
   * @param {string} [primarySelector] - Selector that resolves to the primary element.
   * @returns {object} The container stub.
   */
  static container({ primary, canonical }, extra = {}, primarySelector = 'a.primary') {
    const primaryElement = ConditionMatcherUtils.element(primary);
    const canonicalElement = ConditionMatcherUtils.element(canonical);

    return {
      ...extra,
      querySelector: jasmine.createSpy('querySelector').and.callFake((selector) => (
        selector === primarySelector ? primaryElement : canonicalElement
      )),
    };
  }
}

export { ConditionMatcherUtils };
