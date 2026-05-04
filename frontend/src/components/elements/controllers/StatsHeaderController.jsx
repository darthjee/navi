import fetchStats from '../../../clients/StatsClient.js';

class StatsHeaderController {
  #setStats;
  #setError;
  #setLoading;

  constructor(setStats, setError, setLoading) {
    this.#setStats = setStats;
    this.#setError = setError;
    this.#setLoading = setLoading;
  }

  static build(setStats, setError, setLoading) {
    return new StatsHeaderController(setStats, setError, setLoading);
  }

  buildEffect() {
    return () => {
      this.#load();
      const interval = setInterval(() => this.#load(), 5000);
      return () => clearInterval(interval);
    };
  }

  #load() {
    fetchStats()
      .then((data) => {
        this.#setStats(data);
        this.#setError(null);
      })
      .catch((err) => this.#setError(err.message))
      .finally(() => this.#setLoading(false));
  }
}

export default StatsHeaderController;
