import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function WorkerCard({ worker }) {
  const statusVariant = {
    idle:   'success',
    busy:   'warning',
    failed: 'danger',
  }[worker.status] || 'secondary';

  return (
    <div className={`card border-${statusVariant} mb-2`}>
      <div className="card-body py-2 px-3">
        <span className="fw-bold me-2">Worker {worker.id}</span>
        <span className={`badge bg-${statusVariant}`}>{worker.status}</span>
        {worker.job && (
          <span className="ms-2 text-muted small">{worker.job}</span>
        )}
      </div>
    </div>
  );
}

function JobRow({ job }) {
  return (
    <tr>
      <td>{job.id}</td>
      <td>{job.url}</td>
      <td>
        <span className={`badge bg-${job.status === 'pending' ? 'secondary' : 'info'}`}>
          {job.status}
        </span>
      </td>
      <td>{job.retries ?? 0}</td>
    </tr>
  );
}

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

  const workers = stats?.workers ?? [];
  const jobs = stats?.jobs ?? [];

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Navi — Cache Warmer</h1>

      <section className="mb-5">
        <h2 className="h4 mb-3">Workers ({workers.length})</h2>
        {workers.length === 0 ? (
          <p className="text-muted">No workers registered.</p>
        ) : (
          workers.map((w) => <WorkerCard key={w.id} worker={w} />)
        )}
      </section>

      <section>
        <h2 className="h4 mb-3">Job Queue ({jobs.length})</h2>
        {jobs.length === 0 ? (
          <p className="text-muted">No jobs in queue.</p>
        ) : (
          <table className="table table-bordered table-sm">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>URL</th>
                <th>Status</th>
                <th>Retries</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default App;
