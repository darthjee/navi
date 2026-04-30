import { useEffect, useState } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import JobsHelper from './JobsHelper.jsx';
import JobsView from './JobsView.jsx';
import { VARIANT_BY_STATUS } from '../constants/jobStatus.js';

function Jobs() {
  const { status } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const view = new JobsView(status, location.search, navigate);
  const { activeFilters, filterQuery, handleClassFilterChange } = view;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(view.buildEffect(setJobs, setError, setLoading), [status, filterQuery]);

  if (loading) return JobsHelper.renderLoading();
  if (error) return JobsHelper.renderError(error);

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Jobs</h1>
      {JobsHelper.renderStatusTabs(status, filterQuery)}
      {JobsHelper.renderFilterPanel(activeFilters, handleClassFilterChange)}
      {jobs.length === 0
        ? <p className="text-muted">No jobs found.</p>
        : (
          <table className="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Class</th>
                <th>URL</th>
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
                  <td>{job.jobClass}</td>
                  <td>{job.url ?? '—'}</td>
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
