const fetchStats = () => {
  return fetch('/stats.json').then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
};

export default fetchStats;
