import { useEffect, useState } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { fetchJobs, fetchJobsByStatus, STATUSES } from '../clients/JobsClient.js';
import { VARIANT_BY_STATUS } from '../constants/jobStatus.js';
import { JOB_CLASSES } from '../constants/jobClasses.js';
import { parseFilterParams, serializeFilterParams } from '../utils/filterParams.js';

function Jobs() {
  const { status } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const activeFilters = parseFilterParams(location.search);
  const filterQuery = serializeFilterParams(activeFilters);

  useEffect(() => {
    setLoading(true);
    const load = status
      ? fetchJobsByStatus(status, filterQuery)
      : fetchJobs(filterQuery);
    load
      .then((data) => {
        setJobs(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [status, filterQuery]);

  const handleClassFilterChange = (jobClass, checked) => {
    const current = activeFilters.class || [];
    const updated = checked
      ? [...current, jobClass]
      : current.filter((c) => c !== jobClass);
    const newQuery = serializeFilterParams({ class: updated });
    const base = status ? `/jobs/${status}` : '/jobs';
    navigate(newQuery ? `${base}?${newQuery}` : base);
  };

  const statusTabs = (
    <ul className="nav nav-tabs mb-3">
      {STATUSES.map((s) => {
        const tabQuery = filterQuery ? `?${filterQuery}` : '';
        return (
          <li className="nav-item" key={s}>
            <Link
              className={`nav-link${status === s ? ' active' : ''}`}
              to={`/jobs/${s}${tabQuery}`}
            >
              {s}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const filterPanel = (
    <div className="mb-3">
      <label className="form-label fw-semibold">Filter by class</label>
      <div className="d-flex flex-wrap gap-2">
        {JOB_CLASSES.map((jobClass) => (
          <div className="form-check form-check-inline" key={jobClass}>
            <input
              className="form-check-input"
              type="checkbox"
              id={`filter-${jobClass}`}
              checked={(activeFilters.class || []).includes(jobClass)}
              onChange={(e) => handleClassFilterChange(jobClass, e.target.checked)}
            />
            <label className="form-check-label" htmlFor={`filter-${jobClass}`}>
              {jobClass}
            </label>
          </div>
        ))}
      </div>
    </div>
  );

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
      {statusTabs}
      {filterPanel}
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
