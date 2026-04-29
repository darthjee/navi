import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import JobDetails from './JobDetails.jsx';
import JobHelper from './JobHelper.jsx';

function Job() {
  const { id } = useParams();
  const [job, setJob] = useState(undefined);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(JobHelper.buildEffect(id, setJob, setError, setLoading), [id]);

  if (loading) return JobHelper.renderLoading();
  if (error) return JobHelper.renderError(error);
  if (job === null) return JobHelper.renderNotFound();

  return <JobDetails job={job} />;
}

export default Job;
