/**
 * Filters a job collection by one or more job classes.
 * @author darthjee
 */
class JobsFilter {
  /**
   * Creates a new JobsFilter instance.
   * @param {object[]} jobs - The collection of jobs to filter.
   * @param {object} [filters={}] - The filters object (e.g. `{ class: ['ResourceRequestJob'] }`).
   */
  constructor(jobs, filters = {}) {
    this._jobs = jobs;
    this._filters = filters;
  }

  /**
   * Returns the filtered job list.
   * When no class filter is provided, all jobs are returned unchanged.
   * @returns {object[]} The filtered jobs.
   */
  filter() {
    const classes = this.#normalizeClasses();

    if (classes.length === 0) {
      return this._jobs;
    }

    return this._jobs.filter((job) => classes.includes(job.constructor.name));
  }

  /**
   * Normalises the class filter value to an array.
   * Express's qs parser collapses a single `filters[class][]=Foo` to a plain string.
   * @returns {string[]} The normalised array of class names.
   */
  #normalizeClasses() {
    const value = this._filters.class;

    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  }
}

export { JobsFilter };
