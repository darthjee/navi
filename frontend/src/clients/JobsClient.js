const STATUSES = ['enqueued', 'processing', 'failed', 'finished', 'dead'];

const fetchJobsByStatus = (status, filterQuery = '') => {
  const qs = filterQuery ? `?${filterQuery}` : '';
  return fetch(`/jobs/${status}.json${qs}`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
};

const fetchJobs = (filterQuery = '') => {
  return Promise.all(STATUSES.map((s) => fetchJobsByStatus(s, filterQuery)))
    .then((results) => results.flat());
};

export { fetchJobs, fetchJobsByStatus, STATUSES };
