import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import JobsController from './controllers/JobsController.jsx';
import JobsHelper from './helpers/JobsHelper.jsx';
import JobsTable from '../elements/JobsTable.jsx';

function Jobs() {
  const { status } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const view = new JobsController(status, location.search, navigate);
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
      <JobsTable jobs={jobs} />
    </div>
  );
}

export default Jobs;
