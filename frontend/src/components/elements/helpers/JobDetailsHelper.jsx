import { Link } from 'react-router-dom';
import { VARIANT_BY_STATUS } from '../../../constants/jobStatus.js';
import CollapsibleSection from '../CollapsibleSection.jsx';
import LastErrorSection from '../LastErrorSection.jsx';
import ReadyInRow from '../ReadyInRow.jsx';
import RemainingAttempts from '../RemainingAttempts.jsx';
import RetryButton from '../RetryButton.jsx';

class JobDetailsHelper {
  static render(job, onRetry) {
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

              <RemainingAttempts job={job} />
              <ReadyInRow job={job} />
              <LastErrorSection job={job} />
            </dl>
          </div>
        </div>
        <div className="mt-3 d-flex gap-2 align-items-center">
          <Link to="/jobs">← Back to Jobs</Link>
          <RetryButton job={job} onRetry={onRetry} />
        </div>
      </div>
    );
  }
}

export default JobDetailsHelper;
