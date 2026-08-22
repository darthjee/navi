const fetchMemoryStatus = () => {
  return fetch('/memory/status.json')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
};

export default fetchMemoryStatus;
