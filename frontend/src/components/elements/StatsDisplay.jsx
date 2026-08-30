import JobStatItem from './JobStatItem.jsx';
import StatItem from './StatItem.jsx';

function StatsDisplay({ stats }) {
  const workers = stats.workers;
  const jobs = stats.jobs;
  const emissions = stats.emissions;

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
      <span className="fw-semibold small">Emissions</span>
      <div className="d-flex gap-2">
        <StatItem label="Extracted" value={emissions.extracted} variant="secondary" to="/extractions" />
        <StatItem label="Emitted" value={emissions.emitted} variant="success" to="/emissions" />
        <StatItem label="Failed" value={emissions.failed} variant="warning" to="/emissions" />
        <StatItem label="Dead" value={emissions.dead} variant="dark" to="/emissions" />
      </div>
      <div className="vr mx-1" />
      <StatItem label="Logs" variant="info" to="/logs" />
      <StatItem label="Memory" variant="info" to="/memory/status" />
    </div>
  );
}

export default StatsDisplay;
