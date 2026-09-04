import { useEffect, useMemo, useRef, useState } from 'react';
import MemoryChartController from './controllers/MemoryChartController.jsx';
import ErrorAlert from './ErrorAlert.jsx';
import MemoryUsageChartHelper from './helpers/MemoryUsageChartHelper.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';
import fetchMemoryHistory from '../../clients/MemoryHistoryClient.js';

// `maximum` and `status` are the deployment's configured maximum and the
// current status label, already fetched by the page (see
// `pages/MemoryStatus.jsx`) — this component owns fetching its own history
// points (via `MemoryChartController`) but does not fetch either of those.
function MemoryUsageChart({ maximum, status }) {
  const [points, setPoints] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const cancelledRef = useRef(false);
  const lastIdRef = useRef(null);

  const view = useMemo(
    () => MemoryChartController.build(fetchMemoryHistory, setPoints, setError, setLoading),
    []
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(view.buildPollingEffect(cancelledRef, lastIdRef), []);

  if (loading) return <LoadingSpinner message="Loading memory history…" />;
  if (error) return <ErrorAlert error={error} prefix="Failed to load memory history" />;

  return MemoryUsageChartHelper.render(points, maximum, status);
}

export default MemoryUsageChart;
