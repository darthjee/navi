/**
 * Utility class for parsing and serialising job-class filter query parameters.
 * @author darthjee
 */
class FilterParams {
  /**
   * Creates a new FilterParams instance.
   * @param {string} search - The URL search string (e.g. `?filters[class][]=Foo`).
   */
  constructor(search) {
    this._params = new URLSearchParams(search);
  }

  /**
   * Parses `filters[class][]` values from the URL search string.
   * @returns {{ class: string[] }} The parsed filters object.
   */
  parse() {
    return { class: this._params.getAll('filters[class][]') };
  }

  /**
   * Serialises a filters object into a query string.
   * @param {{ class: string[] }} filters - The filters object.
   * @returns {string} The serialised query string (e.g. `filters[class][]=Foo&filters[class][]=Bar`).
   */
  static serialize(filters) {
    const classes = filters.class || [];
    return classes.map(FilterParams.#classParam).join('&');
  }

  /**
   * Formats a single class name as a `filters[class][]` query parameter.
   * @param {string} c - The class name.
   * @returns {string} The encoded query parameter.
   */
  static #classParam(c) {
    return `filters[class][]=${encodeURIComponent(c)}`;
  }
}

export default FilterParams;
