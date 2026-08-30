const fetchExtractions = ({ lastId } = {}) => {
  const url = lastId !== null && lastId !== undefined
    ? `/extractions.json?last_id=${encodeURIComponent(lastId)}`
    : '/extractions.json';

  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
};

export default fetchExtractions;
