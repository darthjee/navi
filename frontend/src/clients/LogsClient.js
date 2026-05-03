const fetchLogs = ({ lastId } = {}) => {
  const url = lastId !== null && lastId !== undefined
    ? `/logs.json?last_id=${encodeURIComponent(lastId)}`
    : '/logs.json';

  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
};

export const fetchJobLogs = (jobId, { lastId } = {}) => {
  const base = `/jobs/${encodeURIComponent(jobId)}/logs.json`;
  const url = lastId !== null && lastId !== undefined
    ? `${base}?last_id=${encodeURIComponent(lastId)}`
    : base;

  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
};

export default fetchLogs;
