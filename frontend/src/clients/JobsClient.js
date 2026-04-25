const STATUSES = ['enqueued', 'processing', 'failed', 'finished', 'dead'];

const fetchJobsByStatus = (status) => {
  return fetch(`/jobs/${status}.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
};

const fetchJobs = () => {
  return Promise.all(STATUSES.map(fetchJobsByStatus))
    .then((results) => results.flat());
};

export { fetchJobs, fetchJobsByStatus, STATUSES };
