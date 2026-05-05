import JobStatItem from './JobStatItem.jsx';
import StatItem from './StatItem.jsx';

function StatsDisplay({ stats }) {
  const workers = stats.workers;
  const jobs = stats.jobs;

  return (
    <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
      <span className="fw-semibold small">Workers</span>
      <div className="d-flex gap-2">
        <StatItem label="Idle" value={workers.idle} variant="success" />
        <StatItem label="Busy" value={workers.busy} variant="warning" />
      </div>
      <div className="vr mx-1" />
      <span className="fw-semibold small">Jobs</span>
      <div className="d-flex gap-2">
        <JobStatItem label="Enqueued" value={jobs.enqueued} variant="secondary" status="enqueued" />
        <JobStatItem label="Processing" value={jobs.processing} variant="primary" status="processing" />
        <JobStatItem label="Failed" value={jobs.failed} variant="danger" status="failed" />
        <JobStatItem label="Finished" value={jobs.finished} variant="success" status="finished" />
        <JobStatItem label="Dead" value={jobs.dead} variant="dark" status="dead" />
      </div>
      <div className="vr mx-1" />
      <StatItem label="Logs" variant="info" to="/logs" />
    </div>
  );
}

export default StatsDisplay;
