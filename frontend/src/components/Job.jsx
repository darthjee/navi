import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReadyCountdown from './ReadyCountdown.jsx';
import fetchJob from '../clients/JobClient.js';
import { VARIANT_BY_STATUS } from '../constants/jobStatus.js';

const STATUSES_WITH_REMAINING_ATTEMPTS = new Set(['enqueued', 'processing', 'failed']);
const STATUSES_WITH_READY_IN = new Set(['failed']);
const STATUSES_WITH_ERROR = new Set(['failed', 'dead']);

function CollapsibleSection({ label, children }) {
  return (
    <details>
      <summary>{label}</summary>
      {children}
    </details>
  );
}

function JobDetails({ job }) {
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

            <dt className="col-sm-3">Class</dt>
            <dd className="col-sm-9">{job.jobClass}</dd>

            <dt className="col-sm-3">Arguments</dt>
            <dd className="col-sm-9">
              <CollapsibleSection label="Show arguments">
                <pre>{JSON.stringify(job.arguments, null, 2)}</pre>
              </CollapsibleSection>
            </dd>

            {STATUSES_WITH_REMAINING_ATTEMPTS.has(job.status) && (
              <>
                <dt className="col-sm-3">Remaining attempts</dt>
                <dd className="col-sm-9">{job.remainingAttempts}</dd>
              </>
            )}

            {STATUSES_WITH_READY_IN.has(job.status) && (
              <>
                <dt className="col-sm-3">Ready in</dt>
                <dd className="col-sm-9"><ReadyCountdown readyInMs={job.readyInMs} /></dd>
              </>
            )}

            {STATUSES_WITH_ERROR.has(job.status) && job.lastError !== null && job.lastError !== undefined && (
              <>
                <dt className="col-sm-3">Last error</dt>
                <dd className="col-sm-9">
                  <CollapsibleSection label="Show error">
                    <p>{job.lastError}</p>
                    {job.backtrace && <pre>{job.backtrace}</pre>}
                  </CollapsibleSection>
                </dd>
              </>
            )}
          </dl>
        </div>
      </div>
      <div className="mt-3">
        <Link to="/jobs">← Back to Jobs</Link>
      </div>
    </div>
  );
}

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
