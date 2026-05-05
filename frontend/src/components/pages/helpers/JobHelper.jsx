import { Link } from 'react-router-dom';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LoadingSpinner from '../../elements/LoadingSpinner.jsx';

class JobHelper {
  static renderLoading() {
    return <LoadingSpinner message="Loading job…" className="container mt-5 text-center" />;
  }

  static renderError(error) {
    return (
      <ErrorAlert
        error={error}
        prefix="Failed to load job"
        containerClassName="container mt-5"
        alertClassName="alert alert-danger"
      />
    );
  }

  static renderNotFound() {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">Job not found.</div>
        <Link to="/jobs">← Back to Jobs</Link>
      </div>
    );
  }
}

export default JobHelper;
