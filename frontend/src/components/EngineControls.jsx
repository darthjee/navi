import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EngineControlsController from './controllers/EngineControlsController.jsx';
import EngineControlsHelper from './helpers/EngineControlsHelper.jsx';

function EngineControls() {
  const [status, setStatus] = useState(null);
  const intervalRef = useRef(null);
  const helper = useMemo(() => new EngineControlsHelper(), []);

  const refreshStatus = useCallback(
    () => EngineControlsController.fetchStatus(setStatus),
    []
  );

  const view = useMemo(
    () => EngineControlsController.build(status, refreshStatus),
    [status, refreshStatus]
  );

  useEffect(view.buildPollingEffect(intervalRef, refreshStatus), [refreshStatus]);

  return helper.render(view);
}

export default EngineControls;

