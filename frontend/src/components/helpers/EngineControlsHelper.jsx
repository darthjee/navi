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
          {view.showPause() && (
            <button
              className="btn btn-sm btn-outline-warning"
              onClick={() => view.handlePause()}
            >
              Pause
            </button>
          )}
          {view.showStop() && (
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => view.handleStop()}
            >
              Stop
            </button>
          )}
          {view.showRestart() && (
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => view.handleRestart()}
            >
              Restart
            </button>
          )}
          {view.showContinue() && (
            <button
              className="btn btn-sm btn-outline-success"
              onClick={() => view.handleContinue()}
            >
              Continue
            </button>
          )}
          {view.showStart() && (
            <button
              className="btn btn-sm btn-outline-success"
              onClick={() => view.handleStart()}
            >
              Start
            </button>
          )}
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

