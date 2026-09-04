const fetchMemoryHistory = ({ lastId } = {}) => {
  const url = lastId !== null && lastId !== undefined
    ? `/memory/history.json?last_id=${encodeURIComponent(lastId)}`
    : '/memory/history.json';

  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
};

export default fetchMemoryHistory;
