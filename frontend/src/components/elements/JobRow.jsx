import { Link } from 'react-router-dom';
import JobStatusBadge from './JobStatusBadge.jsx';

function JobRow({ job }) {
  return (
    <tr>
      <td>
        <Link to={`/job/${job.id}`}>{job.id}</Link>
      </td>
      <td>
        <JobStatusBadge status={job.status} />
      </td>
      <td>{job.attempts}</td>
      <td>{job.jobClass}</td>
      <td>{job.url ?? '—'}</td>
    </tr>
  );
}

export default JobRow;
