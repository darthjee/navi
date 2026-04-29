import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import JobDetails from './JobDetails.jsx';
import fetchJob from '../clients/JobClient.js';

const buildJobEffect = (id, setJob, setError, setLoading) => () => {
  fetchJob(id)
    .then((data) => {
      setJob(data);
      setError(null);
    })
    .catch((err) => setError(err.message))
    .finally(() => setLoading(false));
};

function Job() {
  const { id } = useParams();
  const [job, setJob] = useState(undefined);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(buildJobEffect(id, setJob, setError, setLoading), [id]);

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

  return <JobDetails job={job} />;
}

export default Job;
