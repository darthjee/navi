import { useEffect, useState } from 'react';
import StatsHeaderHelper from './StatsHeaderHelper.jsx';
import StatsHeaderView from './StatsHeaderView.jsx';

function StatsHeader() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(StatsHeaderView.buildEffect(setStats, setError, setLoading), []);

  if (loading) return StatsHeaderHelper.renderLoading();
  if (error) return StatsHeaderHelper.renderError(error);

  return StatsHeaderHelper.render(stats);
}

export default StatsHeader;
