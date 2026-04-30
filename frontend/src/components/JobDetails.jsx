import JobDetailsHelper from './helpers/JobDetailsHelper.jsx';

function JobDetails({ job }) {
  return JobDetailsHelper.render(job);
}

export default JobDetails;
