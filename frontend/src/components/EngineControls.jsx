import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EngineControlsHelper from './EngineControlsHelper.jsx';
import EngineControlsView from './EngineControlsView.jsx';

function EngineControls() {
  const [status, setStatus] = useState(null);
  const intervalRef = useRef(null);
  const helper = useMemo(() => new EngineControlsHelper(), []);

  const refreshStatus = useCallback(
    () => EngineControlsView.fetchStatus(setStatus),
    []
  );

  const view = useMemo(
    () => EngineControlsView.build(status, refreshStatus),
    [status, refreshStatus]
  );

  useEffect(view.buildPollingEffect(intervalRef, refreshStatus), [refreshStatus]);

  return helper.render(view);
}

export default EngineControls;

