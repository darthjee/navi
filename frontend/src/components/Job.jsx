import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import fetchJob from '../clients/JobClient.js';
import { VARIANT_BY_STATUS } from '../constants/jobStatus.js';

function Job() {
  const { id } = useParams();
  const [job, setJob] = useState(undefined);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJob(id)
      .then((data) => {
        setJob(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status" />
        <p className="mt-2">Loading job…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">Failed to load job: {error}</div>
      </div>
    );
  }

  if (job === null) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">Job not found.</div>
        <Link to="/jobs">← Back to Jobs</Link>
      </div>
    );
  }

  const variant = VARIANT_BY_STATUS[job.status] ?? 'secondary';

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Job Details</h1>
      <div className="card">
        <div className="card-body">
          <dl className="row mb-0">
            <dt className="col-sm-3">ID</dt>
            <dd className="col-sm-9 font-monospace">{job.id}</dd>

            <dt className="col-sm-3">Status</dt>
            <dd className="col-sm-9">
              <span className={`badge text-bg-${variant}`}>{job.status}</span>
            </dd>

            <dt className="col-sm-3">Attempts</dt>
            <dd className="col-sm-9">{job.attempts}</dd>
          </dl>
        </div>
      </div>
      <div className="mt-3">
        <Link to="/jobs">← Back to Jobs</Link>
      </div>
    </div>
  );
}

export default Job;
