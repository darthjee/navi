import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EngineControlsHelper from './EngineControlsHelper.jsx';

function EngineControls() {
  const [status, setStatus] = useState(null);
  const intervalRef = useRef(null);

  const refreshStatus = useCallback(
    () => EngineControlsHelper.fetchStatus(setStatus),
    []
  );

  const helper = useMemo(
    () => EngineControlsHelper.build(status, refreshStatus),
    [status, refreshStatus]
  );

  useEffect(helper.buildPollingEffect(intervalRef, refreshStatus), [refreshStatus]);

  return helper.render();
}

export default EngineControls;

