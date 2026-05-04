import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import JobController from './controllers/JobController.jsx';
import JobHelper from './helpers/JobHelper.jsx';
import { fetchJobLogs } from '../../clients/LogsClient.js';
import JobDetails from '../elements/JobDetails.jsx';
import Logs from '../elements/Logs.jsx';

function Job() {
  const { id } = useParams();
  const [job, setJob] = useState(undefined);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
    setLoading(true);
  }, []);

  const fetchLogs = useCallback((opts) => fetchJobLogs(id, opts), [id]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(JobController.buildEffect(id, setJob, setError, setLoading), [id, refreshKey]);

  if (loading) return JobHelper.renderLoading();
  if (error) return JobHelper.renderError(error);
  if (job === null) return JobHelper.renderNotFound();

  return (
    <>
      <JobDetails job={job} onRetry={() => JobController.handleRetry(id, refresh)} />
      <Logs fetchLogs={fetchLogs} />
    </>
  );
}

export default Job;
