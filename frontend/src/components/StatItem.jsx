function StatItem({ label, value, variant }) {
  return (
    <div className="col">
      <div className={`card text-bg-${variant} h-100`}>
        <div className="card-body text-center">
          <div className="fs-2 fw-bold">{value}</div>
          <div className="text-uppercase small">{label}</div>
        </div>
      </div>
    </div>
  );
}

export default StatItem;
