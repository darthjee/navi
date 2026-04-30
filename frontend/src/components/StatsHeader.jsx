import { useEffect, useMemo, useState } from 'react';
import StatsHeaderController from './controllers/StatsHeaderController.jsx';
import StatsHeaderHelper from './helpers/StatsHeaderHelper.jsx';

function StatsHeader() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const view = useMemo(
    () => StatsHeaderController.build(setStats, setError, setLoading),
    []
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(view.buildEffect(), []);

  if (loading) return StatsHeaderHelper.renderLoading();
  if (error) return StatsHeaderHelper.renderError(error);

  return StatsHeaderHelper.render(stats);
}

export default StatsHeader;
