import { useEffect, useMemo, useState } from 'react';
import MemoryStatusController from './controllers/MemoryStatusController.jsx';
import MemoryStatusHelper from './helpers/MemoryStatusHelper.jsx';
import './MemoryStatus.css';

function MemoryStatus() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const view = useMemo(
    () => MemoryStatusController.build(setStatus, setError, setLoading),
    []
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(view.buildEffect(), []);

  if (loading) return MemoryStatusHelper.renderLoading();
  if (error) return MemoryStatusHelper.renderError(error);

  return MemoryStatusHelper.render(status);
}

export default MemoryStatus;
