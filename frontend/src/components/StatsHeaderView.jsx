import fetchStats from '../clients/StatsClient.js';

class StatsHeaderView {
  static buildEffect(setStats, setError, setLoading) {
    return () => {
      const load = () => {
        fetchStats()
          .then((data) => {
            setStats(data);
            setError(null);
          })
          .catch((err) => setError(err.message))
          .finally(() => setLoading(false));
      };

      load();
      const interval = setInterval(load, 5000);
      return () => clearInterval(interval);
    };
  }
}

export default StatsHeaderView;
