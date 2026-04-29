import {
  pauseEngine,
  stopEngine,
  continueEngine,
  startEngine,
  restartEngine,
  getEngineStatus,
} from '../clients/EngineClient.js';
import noop from '../utils/noop.js';

const POLL_INTERVAL_MS = 2000;
const TRANSITIONAL_STATUSES = new Set(['pausing', 'stopping']);

class EngineControlsHelper {
  #status;
  #refreshStatus;

  constructor(status, refreshStatus) {
    this.#status = status;
    this.#refreshStatus = refreshStatus;
  }

  static build(status, refreshStatus) {
    return new EngineControlsHelper(status, refreshStatus);
  }

  static fetchStatus(setStatus) {
    getEngineStatus()
      .then(setStatus)
      .catch(noop);
  }

  isTransitioning() {
    return TRANSITIONAL_STATUSES.has(this.#status);
  }

  isRunning() {
    return this.#status === 'running';
  }

  isPaused() {
    return this.#status === 'paused';
  }

  isStopped() {
    return this.#status === 'stopped';
  }

  handleAction(action) {
    action().then(this.#refreshStatus).catch(noop);
  }

  buildPollingEffect(intervalRef, refreshStatus) {
    return () => {
      refreshStatus();
      intervalRef.current = setInterval(refreshStatus, POLL_INTERVAL_MS);
      return () => clearInterval(intervalRef.current);
    };
  }

  renderSpinner() {
    return (
      <span className="spinner-border spinner-border-sm text-secondary" role="status" aria-label="transitioning" />
    );
  }

  render() {
    return (
      <div className="d-flex align-items-center gap-2">
        <span className="fw-semibold small">Engine</span>
        {this.isTransitioning() && this.renderSpinner()}
        <div className="d-flex gap-1">
          <button
            className="btn btn-sm btn-outline-warning"
            disabled={!this.isRunning()}
            onClick={() => this.handleAction(pauseEngine)}
          >
            Pause
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            disabled={!this.isRunning()}
            onClick={() => this.handleAction(stopEngine)}
          >
            Stop
          </button>
          <button
            className="btn btn-sm btn-outline-primary"
            disabled={!this.isRunning()}
            onClick={() => this.handleAction(restartEngine)}
          >
            Restart
          </button>
          <button
            className="btn btn-sm btn-outline-success"
            disabled={!this.isPaused()}
            onClick={() => this.handleAction(continueEngine)}
          >
            Continue
          </button>
          <button
            className="btn btn-sm btn-outline-success"
            disabled={!this.isStopped()}
            onClick={() => this.handleAction(startEngine)}
          >
            Start
          </button>
        </div>
      </div>
    );
  }
}

export default EngineControlsHelper;
