import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import StatItem from './components/StatItem.jsx';

function App() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      fetch('/stats.json')
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
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
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status" />
        <p className="mt-2">Loading stats…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">Failed to load stats: {error}</div>
      </div>
    );
  }

  const workers = stats?.workers ?? {};
  const jobs = stats?.jobs ?? {};

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Navi — Cache Warmer</h1>

      <section className="mb-5">
        <h2 className="h4 mb-3">Workers</h2>
        <div className="row row-cols-2 row-cols-md-4 g-3">
          <StatItem label="Idle"  value={workers.idle ?? 0} variant="success" />
          <StatItem label="Busy"  value={workers.busy ?? 0} variant="warning" />
        </div>
      </section>

      <section>
        <h2 className="h4 mb-3">Jobs</h2>
        <div className="row row-cols-2 row-cols-md-5 g-3">
          <StatItem label="Enqueued"   value={jobs.enqueued   ?? 0} variant="secondary" />
          <StatItem label="Processing" value={jobs.processing ?? 0} variant="primary"   />
          <StatItem label="Failed"     value={jobs.failed     ?? 0} variant="danger"    />
          <StatItem label="Finished"   value={jobs.finished   ?? 0} variant="success"   />
          <StatItem label="Dead"       value={jobs.dead       ?? 0} variant="dark"      />
        </div>
      </section>
    </div>
  );
}

export default App;
