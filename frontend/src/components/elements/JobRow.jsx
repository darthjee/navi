import { Link } from 'react-router-dom';
import formatTimestamp from '../../utils/formatTimestamp.js';
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
      <td>{formatTimestamp(job.endedAt)}</td>
    </tr>
  );
}

export default JobRow;
