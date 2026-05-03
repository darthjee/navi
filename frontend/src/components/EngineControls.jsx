import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSettings } from '../clients/EngineClient.js';
import EngineControlsController from './controllers/EngineControlsController.jsx';
import EngineControlsHelper from './helpers/EngineControlsHelper.jsx';

function EngineControls() {
  const [status, setStatus] = useState(null);
  const [shutdownEnabled, setShutdownEnabled] = useState(null);
  const intervalRef = useRef(null);
  const helper = useMemo(() => new EngineControlsHelper(), []);

  const refreshStatus = useCallback(
    () => EngineControlsController.fetchStatus(setStatus),
    []
  );

  const view = useMemo(
    () => EngineControlsController.build(status, refreshStatus, shutdownEnabled),
    [status, refreshStatus, shutdownEnabled]
  );

  useEffect(() => {
    getSettings()
      .then(() => setShutdownEnabled(true))
      .catch(() => setShutdownEnabled(false));
  }, []);

  useEffect(view.buildPollingEffect(intervalRef, refreshStatus), [refreshStatus]);

  return helper.render(view);
}

export default EngineControls;

