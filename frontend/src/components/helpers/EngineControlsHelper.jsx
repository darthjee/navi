class EngineControlsHelper {
  renderSpinner() {
    return (
      <span className="spinner-border spinner-border-sm text-secondary" role="status" aria-label="transitioning" />
    );
  }

  render(view) {
    return (
      <div className="d-flex align-items-center gap-2">
        <span className="fw-semibold small">Engine</span>
        {view.isTransitioning() && this.renderSpinner()}
        <div className="d-flex gap-1">
          <button
            className="btn btn-sm btn-outline-warning"
            disabled={!view.isRunning()}
            onClick={() => view.handlePause()}
          >
            Pause
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            disabled={!view.isRunning()}
            onClick={() => view.handleStop()}
          >
            Stop
          </button>
          <button
            className="btn btn-sm btn-outline-primary"
            disabled={!view.isRunning()}
            onClick={() => view.handleRestart()}
          >
            Restart
          </button>
          <button
            className="btn btn-sm btn-outline-success"
            disabled={!view.isPaused()}
            onClick={() => view.handleContinue()}
          >
            Continue
          </button>
          <button
            className="btn btn-sm btn-outline-success"
            disabled={!view.isStopped()}
            onClick={() => view.handleStart()}
          >
            Start
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => view.handleShutdown()}
          >
            Shut Down
          </button>
        </div>
      </div>
    );
  }
}

export default EngineControlsHelper;

