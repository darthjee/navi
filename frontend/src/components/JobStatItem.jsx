import StatItem from './StatItem.jsx';

function JobStatItem({ label, value, variant, status }) {
  return <StatItem label={label} value={value} variant={variant} to={`/jobs/${status}`} />;
}

export default JobStatItem;
