import { useEffect, useState } from 'react';
import JobStatItem from './JobStatItem.jsx';
import StatItem from './StatItem.jsx';
import fetchStats from '../clients/StatsClient.js';

function StatsHeader() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      fetchStats()
        .then((data) => {
          setStats(data);
          setError(null);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    };

    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-center my-3">
        <div className="spinner-border" role="status" />
        <p className="mt-2">Loading stats…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger my-3">Failed to load stats: {error}</div>
    );
  }

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
    </div>
  );
}

export default StatsHeader;
