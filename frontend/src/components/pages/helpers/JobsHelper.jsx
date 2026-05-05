import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LoadingSpinner from '../../elements/LoadingSpinner.jsx';
import FilterCheckbox from '../FilterCheckbox.jsx';
import FilterPanel from '../FilterPanel.jsx';
import StatusTab from '../StatusTab.jsx';
import StatusTabs from '../StatusTabs.jsx';

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
    return <StatusTabs status={status} filterQuery={filterQuery} />;
  }

  /**
   * Renders a single status tab item.
   * @param {string} s - The status name for this tab.
   * @param {string|undefined} status - The currently active status tab.
   * @param {string} filterQuery - The serialised filter query string.
   * @returns {JSX.Element}
   */
  static renderStatusTab(s, status, filterQuery) {
    return <StatusTab s={s} status={status} filterQuery={filterQuery} />;
  }

  /**
   * Renders the job-class filter panel.
   * @param {{ class: string[] }} activeFilters - The currently active filters.
   * @param {Function} handleClassFilterChange - The checkbox change handler.
   * @returns {JSX.Element}
   */
  static renderFilterPanel(activeFilters, handleClassFilterChange) {
    return <FilterPanel activeFilters={activeFilters} handleClassFilterChange={handleClassFilterChange} />;
  }

  /**
   * Renders a single job-class filter checkbox.
   * @param {string} jobClass - The job class name for this checkbox.
   * @param {{ class: string[] }} activeFilters - The currently active filters.
   * @param {Function} handleClassFilterChange - The checkbox change handler.
   * @returns {JSX.Element}
   */
  static renderFilterCheckbox(jobClass, activeFilters, handleClassFilterChange) {
    return <FilterCheckbox jobClass={jobClass} activeFilters={activeFilters} handleClassFilterChange={handleClassFilterChange} />;
  }

  /**
   * Renders the loading spinner view.
   * @returns {JSX.Element}
   */
  static renderLoading() {
    return <LoadingSpinner message="Loading jobs…" className="container mt-5 text-center" />;
  }

  /**
   * Renders the error alert view.
   * @param {string} error - The error message.
   * @returns {JSX.Element}
   */
  static renderError(error) {
    return (
      <ErrorAlert
        error={error}
        prefix="Failed to load jobs"
        containerClassName="container mt-5"
        alertClassName="alert alert-danger"
      />
    );
  }
}

export default JobsHelper;
