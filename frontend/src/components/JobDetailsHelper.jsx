import { Link } from 'react-router-dom';
import CollapsibleSection from './CollapsibleSection.jsx';
import ReadyCountdown from './ReadyCountdown.jsx';
import { VARIANT_BY_STATUS } from '../constants/jobStatus.js';

const STATUSES_WITH_REMAINING_ATTEMPTS = new Set(['enqueued', 'processing', 'failed']);
const STATUSES_WITH_READY_IN = new Set(['failed']);
const STATUSES_WITH_ERROR = new Set(['failed', 'dead']);

class JobDetailsHelper {
  static render(job) {
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

              {job.jobClass === 'ResourceRequestJob' && (
                <>
                  <dt className="col-sm-3">URL</dt>
                  <dd className="col-sm-9 font-monospace">{job.arguments?.url}</dd>
                </>
              )}

              <dt className="col-sm-3">Arguments</dt>
              <dd className="col-sm-9">
                <CollapsibleSection label="Show arguments">
                  <pre>{JSON.stringify(job.arguments, null, 2)}</pre>
                </CollapsibleSection>
              </dd>

              {JobDetailsHelper.#renderRemainingAttempts(job)}
              {JobDetailsHelper.#renderReadyIn(job)}
              {JobDetailsHelper.#renderLastError(job)}
            </dl>
          </div>
        </div>
        <div className="mt-3">
          <Link to="/jobs">← Back to Jobs</Link>
        </div>
      </div>
    );
  }

  static #renderRemainingAttempts(job) {
    if (!STATUSES_WITH_REMAINING_ATTEMPTS.has(job.status)) return null;
    return (
      <>
        <dt className="col-sm-3">Remaining attempts</dt>
        <dd className="col-sm-9">{job.remainingAttempts}</dd>
      </>
    );
  }

  static #renderReadyIn(job) {
    if (!STATUSES_WITH_READY_IN.has(job.status)) return null;
    return (
      <>
        <dt className="col-sm-3">Ready in</dt>
        <dd className="col-sm-9"><ReadyCountdown readyInMs={job.readyInMs} /></dd>
      </>
    );
  }

  static #renderLastError(job) {
    if (!STATUSES_WITH_ERROR.has(job.status)) return null;
    if (job.lastError === null || job.lastError === undefined) return null;
    return (
      <>
        <dt className="col-sm-3">Last error</dt>
        <dd className="col-sm-9">
          <CollapsibleSection label="Show error">
            <p>{job.lastError}</p>
            {job.backtrace && <pre>{job.backtrace}</pre>}
          </CollapsibleSection>
        </dd>
      </>
    );
  }
}

export default JobDetailsHelper;
