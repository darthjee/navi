import { useEffect, useMemo, useRef, useState } from 'react';
import EmissionsController from './controllers/EmissionsController.jsx';
import EmissionsHelper from './helpers/EmissionsHelper.jsx';

const EMPTY_COUNTS = { extracted: 0, emitted: 0, failed: 0, dead: 0 };

function Emissions() {
  const [data, setData] = useState({ counts: EMPTY_COUNTS, rows: [] });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const cancelledRef = useRef(false);
  const lastIdRef = useRef(null);

  const view = useMemo(
    () => EmissionsController.build(setData, setError, setLoading),
    []
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(view.buildPollingEffect(cancelledRef, lastIdRef), []);

  if (loading) return EmissionsHelper.renderLoading();
  if (error) return EmissionsHelper.renderError(error);

  return EmissionsHelper.render({
    counts: data.counts,
    rows: data.rows,
    statusFilter,
    onStatusFilterChange: setStatusFilter,
  });
}

export default Emissions;
