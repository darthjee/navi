import { fetchJobs, fetchJobsByStatus } from '../clients/JobsClient.js';
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
    const updated = this.#updatedClasses(jobClass, checked);
    const newQuery = this.#newQuery(updated);
    this.#navigate(this.#destination(newQuery));
  }

  /**
   * Builds the useEffect callback for loading jobs.
   * @param {Function} setJobs - State setter for the job list.
   * @param {Function} setError - State setter for the error message.
   * @param {Function} setLoading - State setter for the loading flag.
   * @returns {Function} The effect callback.
   */
  buildEffect(setJobs, setError, setLoading) {
    return () => {
      const state = { cancelled: false };
      setLoading(true);
      this.buildLoad()
        .then(this.buildSuccessHandler(state, setJobs, setError))
        .catch(this.#buildErrorHandler(state, setError))
        .finally(this.#buildFinallyHandler(state, setLoading));
      return () => { state.cancelled = true; };
    };
  }

  /**
   * Returns the fetch promise for the current status and filter query.
   * @returns {Promise<object[]>}
   */
  buildLoad() {
    return this.#status
      ? fetchJobsByStatus(this.#status, this.filterQuery)
      : fetchJobs(this.filterQuery);
  }

  /**
   * Builds the `.then` success callback for the jobs fetch.
   * @param {{ cancelled: boolean }} state - Cancellation state object.
   * @param {Function} setJobs - State setter for the job list.
   * @param {Function} setError - State setter for the error message.
   * @returns {Function} The success handler.
   */
  buildSuccessHandler(state, setJobs, setError) {
    return (data) => {
      if (!state.cancelled) {
        setJobs(data);
        setError(null);
      }
    };
  }

  /**
   * Builds the `.catch` error callback for the jobs fetch.
   * @param {{ cancelled: boolean }} state - Cancellation state object.
   * @param {Function} setError - State setter for the error message.
   * @returns {Function} The error handler.
   */
  #buildErrorHandler(state, setError) {
    return (err) => { if (!state.cancelled) setError(err.message); };
  }

  /**
   * Builds the `.finally` cleanup callback for the jobs fetch.
   * @param {{ cancelled: boolean }} state - Cancellation state object.
   * @param {Function} setLoading - State setter for the loading flag.
   * @returns {Function} The finally handler.
   */
  #buildFinallyHandler(state, setLoading) {
    return () => { if (!state.cancelled) setLoading(false); };
  }

  /**
   * Returns the updated class list after toggling the given class.
   * @param {string} jobClass - The class name being toggled.
   * @param {boolean} checked - Whether the class is being added or removed.
   * @returns {string[]}
   */
  #updatedClasses(jobClass, checked) {
    const current = this.activeFilters.class || [];
    return checked
      ? [...current, jobClass]
      : this.#withoutClass(current, jobClass);
  }

  /**
   * Returns the current class list with the given class removed.
   * @param {string[]} current - The current class list.
   * @param {string} jobClass - The class to remove.
   * @returns {string[]}
   */
  #withoutClass(current, jobClass) {
    return current.filter((c) => c !== jobClass);
  }

  /**
   * Serialises an updated class list into a query string.
   * @param {string[]} classes - The updated class list.
   * @returns {string}
   */
  #newQuery(classes) {
    return FilterParams.serialize({ class: classes });
  }

  /**
   * Returns the navigation destination URL for the given query string.
   * @param {string} newQuery - The serialised filter query string.
   * @returns {string}
   */
  #destination(newQuery) {
    const base = this.#status ? `/jobs/${this.#status}` : '/jobs';
    return newQuery ? `${base}?${newQuery}` : base;
  }
}

export default JobsView;
