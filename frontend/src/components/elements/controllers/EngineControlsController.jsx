import {
  continueEngine,
  getEngineStatus,
  pauseEngine,
  restartEngine,
  shutdownServer,
  startEngine,
  stopEngine,
} from '../../../clients/EngineClient.js';
import noop from '../../../utils/noop.js';

const POLL_INTERVAL_MS = 2000;
const TRANSITIONAL_STATUSES = new Set(['pausing', 'stopping']);

class EngineControlsController {
  #status;
  #refreshStatus;
  #shutdownEnabled;

  constructor(status, refreshStatus, shutdownEnabled) {
    this.#status = status;
    this.#refreshStatus = refreshStatus;
    this.#shutdownEnabled = shutdownEnabled;
  }

  static build(status, refreshStatus, shutdownEnabled) {
    return new EngineControlsController(status, refreshStatus, shutdownEnabled);
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

  showShutdown() { return this.#shutdownEnabled === true; }
  showPause() { return this.isRunning(); }
  showStop() { return this.isRunning() || this.isPaused(); }
  showContinue() { return this.isPaused(); }
  showStart() { return this.isStopped(); }
  showRestart() { return this.isRunning() || this.isPaused(); }

  handleAction(action) {
    action().then(this.#refreshStatus).catch(noop);
  }

  handlePause() { this.handleAction(pauseEngine); }
  handleStop() { this.handleAction(stopEngine); }
  handleContinue() { this.handleAction(continueEngine); }
  handleStart() { this.handleAction(startEngine); }
  handleRestart() { this.handleAction(restartEngine); }
  handleShutdown() { this.handleAction(shutdownServer); }

  buildPollingEffect(intervalRef, refreshStatus) {
    return () => {
      refreshStatus();
      intervalRef.current = setInterval(refreshStatus, POLL_INTERVAL_MS);
      return () => clearInterval(intervalRef.current);
    };
  }
}

export default EngineControlsController;
