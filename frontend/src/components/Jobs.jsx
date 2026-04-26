import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchJobs, fetchJobsByStatus } from '../clients/JobsClient.js';
import { VARIANT_BY_STATUS } from '../constants/jobStatus.js';

function Jobs() {
  const { status } = useParams();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = status ? fetchJobsByStatus(status) : fetchJobs();
    load
      .then((data) => {
        setJobs(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [status]);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status" />
        <p className="mt-2">Loading jobs…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">Failed to load jobs: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Jobs</h1>
      {jobs.length === 0
        ? <p className="text-muted">No jobs found.</p>
        : (
          <table className="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Attempts</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <Link to={`/job/${job.id}`}>{job.id}</Link>
                  </td>
                  <td>
                    <span className={`badge text-bg-${VARIANT_BY_STATUS[job.status] ?? 'secondary'}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>{job.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
    </div>
  );
}

export default Jobs;
