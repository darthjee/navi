import { Link } from 'react-router-dom';

class JobHelper {
  static renderLoading() {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status" />
        <p className="mt-2">Loading job…</p>
      </div>
    );
  }

  static renderError(error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">Failed to load job: {error}</div>
      </div>
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
