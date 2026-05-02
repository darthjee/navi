const fetchJob = (id) => {
  return fetch(`/job/${id}.json`)
    .then((res) => {
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
};

const retryJob = (id) => {
  return fetch(`/jobs/${id}/retry`, { method: 'PATCH' })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
};

export { retryJob };
export default fetchJob;
