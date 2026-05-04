import ErrorAlert from '../ErrorAlert.jsx';
import LoadingSpinner from '../LoadingSpinner.jsx';
import StatsDisplay from '../StatsDisplay.jsx';

class StatsHeaderHelper {
  static renderLoading() {
    return <LoadingSpinner message="Loading stats…" />;
  }

  static renderError(error) {
    return <ErrorAlert error={error} prefix="Failed to load stats" />;
  }

  static render(stats) {
    return <StatsDisplay stats={stats} />;
  }
}

export default StatsHeaderHelper;
