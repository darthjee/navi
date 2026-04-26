import { Link } from 'react-router-dom';

function StatItem({ label, value, variant, to }) {
  const card = (
    <div className={`card text-bg-${variant} h-100`}>
      <div className="card-body text-center">
        <div className="fs-2 fw-bold">{value}</div>
        <div className="text-uppercase small">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="col">
      {to ? <Link to={to} style={{ textDecoration: 'none' }}>{card}</Link> : card}
    </div>
  );
}

export default StatItem;
