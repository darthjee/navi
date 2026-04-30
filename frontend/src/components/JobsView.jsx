import FilterParams from '../utils/FilterParams.js';

/**
 * Encapsulates the view-level derived state for the Jobs component:
 * active filter parsing, filter query serialisation, and the filter
 * change handler that updates the URL.
 * @author darthjee
 */
class JobsView {
  #status;
  #navigate;

  /**
   * @param {string|undefined} status - The active status route param.
   * @param {string} search - The raw location.search string (e.g. "?filters[class][]=Foo").
   * @param {Function} navigate - React Router navigate function.
   */
  constructor(status, search, navigate) {
    this.#status = status;
    this.#navigate = navigate;
    this.activeFilters = new FilterParams(search).parse();
    this.filterQuery = FilterParams.serialize(this.activeFilters);
    this.handleClassFilterChange = this.handleClassFilterChange.bind(this);
  }

  /**
   * Handles a job-class filter checkbox change by updating the URL query string.
   * @param {string} jobClass - The job class name that was toggled.
   * @param {boolean} checked - Whether the checkbox is now checked.
   */
  handleClassFilterChange(jobClass, checked) {
    const current = this.activeFilters.class || [];
    const updated = checked
      ? [...current, jobClass]
      : current.filter((c) => c !== jobClass);
    const newQuery = FilterParams.serialize({ class: updated });
    const base = this.#status ? `/jobs/${this.#status}` : '/jobs';
    this.#navigate(newQuery ? `${base}?${newQuery}` : base);
  }
}

export default JobsView;
