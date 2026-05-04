import { Link } from 'react-router-dom';
import { STATUSES } from '../../../clients/JobsClient.js';
import { JOB_CLASSES } from '../../../constants/jobClasses.js';

/**
 * Helper class for the Jobs component: encapsulates data-loading, event handling,
 * and rendering logic so the component itself stays lean.
 * @author darthjee
 */
class JobsHelper {
  /**
   * Renders the status tab bar.
   * @param {string|undefined} status - The currently active status tab.
   * @param {string} filterQuery - The serialised filter query string.
   * @returns {JSX.Element}
   */
  static renderStatusTabs(status, filterQuery) {
    return (
      <ul className="nav nav-tabs mb-3">
        {STATUSES.map((s) => JobsHelper.renderStatusTab(s, status, filterQuery))}
      </ul>
    );
  }

  /**
   * Renders a single status tab item.
   * @param {string} s - The status name for this tab.
   * @param {string|undefined} status - The currently active status tab.
   * @param {string} filterQuery - The serialised filter query string.
   * @returns {JSX.Element}
   */
  static renderStatusTab(s, status, filterQuery) {
    const tabQuery = filterQuery ? `?${filterQuery}` : '';
    return (
      <li className="nav-item" key={s}>
        <Link
          className={`nav-link${status === s ? ' active' : ''}`}
          to={`/jobs/${s}${tabQuery}`}
        >
          {s}
        </Link>
      </li>
    );
  }

  /**
   * Renders the job-class filter panel.
   * @param {{ class: string[] }} activeFilters - The currently active filters.
   * @param {Function} handleClassFilterChange - The checkbox change handler.
   * @returns {JSX.Element}
   */
  static renderFilterPanel(activeFilters, handleClassFilterChange) {
    return (
      <div className="mb-3">
        <label className="form-label fw-semibold">Filter by class</label>
        <div className="d-flex flex-wrap gap-2">
          {JOB_CLASSES.map((jobClass) =>
            JobsHelper.renderFilterCheckbox(jobClass, activeFilters, handleClassFilterChange)
          )}
        </div>
      </div>
    );
  }

  /**
   * Renders a single job-class filter checkbox.
   * @param {string} jobClass - The job class name for this checkbox.
   * @param {{ class: string[] }} activeFilters - The currently active filters.
   * @param {Function} handleClassFilterChange - The checkbox change handler.
   * @returns {JSX.Element}
   */
  static renderFilterCheckbox(jobClass, activeFilters, handleClassFilterChange) {
    return (
      <div className="form-check form-check-inline" key={jobClass}>
        <input
          className="form-check-input"
          type="checkbox"
          id={`filter-${jobClass}`}
          checked={(activeFilters.class || []).includes(jobClass)}
          onChange={(e) => handleClassFilterChange(jobClass, e.target.checked)}
        />
        <label className="form-check-label" htmlFor={`filter-${jobClass}`}>
          {jobClass}
        </label>
      </div>
    );
  }

  /**
   * Renders the loading spinner view.
   * @returns {JSX.Element}
   */
  static renderLoading() {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status" />
        <p className="mt-2">Loading jobs…</p>
      </div>
    );
  }

  /**
   * Renders the error alert view.
   * @param {string} error - The error message.
   * @returns {JSX.Element}
   */
  static renderError(error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">Failed to load jobs: {error}</div>
      </div>
    );
  }
}

export default JobsHelper;
