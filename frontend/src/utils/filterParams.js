/**
 * Parses `filters[class][]` from a URL search string into `{ class: string[] }`.
 * @param {string} search - The URL query string (e.g. `?filters[class][]=Foo`).
 * @returns {{ class: string[] }} The parsed filters object.
 */
const parseFilterParams = (search) => {
  const params = new URLSearchParams(search);
  const classes = params.getAll('filters[class][]');
  return { class: classes };
};

/**
 * Serialises a filters object into a query string.
 * @param {{ class: string[] }} filters - The filters object.
 * @returns {string} The serialised query string (e.g. `filters[class][]=Foo&filters[class][]=Bar`).
 */
const serializeFilterParams = (filters) => {
  const classes = filters.class || [];
  return classes.map((c) => `filters[class][]=${encodeURIComponent(c)}`).join('&');
};

export { parseFilterParams, serializeFilterParams };
