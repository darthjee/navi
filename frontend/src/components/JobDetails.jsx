import JobDetailsHelper from './helpers/JobDetailsHelper.jsx';

function JobDetails({ job, onRetry }) {
  return JobDetailsHelper.render(job, onRetry);
}

export default JobDetails;
