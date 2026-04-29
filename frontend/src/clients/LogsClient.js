const fetchLogs = ({ lastId } = {}) => {
  const url = lastId !== null && lastId !== undefined
    ? `/logs.json?last_id=${lastId}`
    : '/logs.json';

  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
};

export default fetchLogs;
