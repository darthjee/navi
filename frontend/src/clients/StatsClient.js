const DEFAULT_STATS = {
  workers: { idle: 0, busy: 0 },
  jobs: { enqueued: 0, processing: 0, failed: 0, finished: 0, dead: 0 },
};

const normalizeStats = (data) => ({
  workers: { ...DEFAULT_STATS.workers, ...data?.workers },
  jobs: { ...DEFAULT_STATS.jobs, ...data?.jobs },
});

const fetchStats = () => {
  return fetch('/stats.json')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(normalizeStats);
};

export default fetchStats;
