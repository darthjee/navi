import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EngineControlsHelper from './EngineControlsHelper.jsx';
import { getEngineStatus } from '../clients/EngineClient.js';
import noop from '../utils/noop.js';

const POLL_INTERVAL_MS = 2000;

function EngineControls() {
  const [status, setStatus] = useState(null);
  const intervalRef = useRef(null);

  const refreshStatus = useCallback(() => {
    getEngineStatus()
      .then(setStatus)
      .catch(noop);
  }, []);

  useEffect(() => {
    refreshStatus();
    intervalRef.current = setInterval(refreshStatus, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [refreshStatus]);

  const helper = useMemo(
    () => new EngineControlsHelper(status, refreshStatus),
    [status, refreshStatus]
  );

  return helper.render();
}

export default EngineControls;
