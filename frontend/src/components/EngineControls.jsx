import { useEffect, useRef, useState } from 'react';
import {
  getEngineStatus,
  pauseEngine,
  stopEngine,
  continueEngine,
  startEngine,
  restartEngine,
} from '../clients/EngineClient.js';
import noop from '../utils/noop.js';

const POLL_INTERVAL_MS = 2000;

const TRANSITIONAL_STATUSES = new Set(['pausing', 'stopping']);

function EngineControls() {
  const [status, setStatus] = useState(null);
  const intervalRef = useRef(null);

  const refreshStatus = () => {
    getEngineStatus()
      .then(setStatus)
      .catch(noop);
  };

  useEffect(() => {
    refreshStatus();
    intervalRef.current = setInterval(refreshStatus, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  const isTransitioning = TRANSITIONAL_STATUSES.has(status);
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isStopped = status === 'stopped';

  const handleAction = (action) => {
    action().then(refreshStatus).catch(noop);
  };

  return (
    <div className="d-flex align-items-center gap-2">
      <span className="fw-semibold small">Engine</span>
      {isTransitioning && (
        <span className="spinner-border spinner-border-sm text-secondary" role="status" aria-label="transitioning" />
      )}
      <div className="d-flex gap-1">
        <button
          className="btn btn-sm btn-outline-warning"
          disabled={!isRunning}
          onClick={() => handleAction(pauseEngine)}
        >
          Pause
        </button>
        <button
          className="btn btn-sm btn-outline-danger"
          disabled={!isRunning}
          onClick={() => handleAction(stopEngine)}
        >
          Stop
        </button>
        <button
          className="btn btn-sm btn-outline-primary"
          disabled={!isRunning}
          onClick={() => handleAction(restartEngine)}
        >
          Restart
        </button>
        <button
          className="btn btn-sm btn-outline-success"
          disabled={!isPaused}
          onClick={() => handleAction(continueEngine)}
        >
          Continue
        </button>
        <button
          className="btn btn-sm btn-outline-success"
          disabled={!isStopped}
          onClick={() => handleAction(startEngine)}
        >
          Start
        </button>
      </div>
    </div>
  );
}

export default EngineControls;
