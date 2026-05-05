import { Link } from 'react-router-dom';

function StatusTab({ s, status, filterQuery }) {
  const tabQuery = filterQuery ? `?${filterQuery}` : '';
  return (
    <li className="nav-item">
      <Link
        className={`nav-link${status === s ? ' active' : ''}`}
        to={`/jobs/${s}${tabQuery}`}
      >
        {s}
      </Link>
    </li>
  );
}

export default StatusTab;
