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
    <>
      <section className="mb-4">
        <h2 className="h4 mb-3">Workers</h2>
        <div className="row row-cols-2 row-cols-md-4 g-3">
          <StatItem label="Idle" value={workers.idle} variant="success" />
          <StatItem label="Busy" value={workers.busy} variant="warning" />
        </div>
      </section>

      <section className="mb-4">
        <h2 className="h4 mb-3">Jobs</h2>
        <div className="row row-cols-2 row-cols-md-5 g-3">
          <JobStatItem label="Enqueued" value={jobs.enqueued} variant="secondary" status="enqueued" />
          <JobStatItem label="Processing" value={jobs.processing} variant="primary" status="processing" />
          <JobStatItem label="Failed" value={jobs.failed} variant="danger" status="failed" />
          <JobStatItem label="Finished" value={jobs.finished} variant="success" status="finished" />
          <JobStatItem label="Dead" value={jobs.dead} variant="dark" status="dead" />
        </div>
      </section>
    </>
  );
}

export default StatsHeader;
