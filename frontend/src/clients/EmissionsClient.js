const fetchEmissions = ({ lastId } = {}) => {
  const url = lastId !== null && lastId !== undefined
    ? `/emissions.json?last_id=${encodeURIComponent(lastId)}`
    : '/emissions.json';

  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
};

export default fetchEmissions;
