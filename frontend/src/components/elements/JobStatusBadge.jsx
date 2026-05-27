import { VARIANT_BY_STATUS } from '../../constants/jobStatus.js';

function JobStatusBadge({ status }) {
  const variant = VARIANT_BY_STATUS[status] ?? 'secondary';
  return <span className={`badge text-bg-${variant}`}>{status}</span>;
}

export default JobStatusBadge;
