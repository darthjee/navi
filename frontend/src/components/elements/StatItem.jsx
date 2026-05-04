import { Link } from 'react-router-dom';

function StatItem({ label, value, variant, to }) {
  const card = (
    <div className={`card text-bg-${variant}`}>
      <div className="card-body text-center py-1 px-2">
        <div className="fs-5 fw-bold">{value}</div>
        <div className="text-uppercase small">{label}</div>
      </div>
    </div>
  );

  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{card}</Link> : card;
}

export default StatItem;
