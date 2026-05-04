class EngineControlsHelper {
  renderSpinner() {
    return (
      <span className="spinner-border spinner-border-sm text-secondary" role="status" aria-label="transitioning" />
    );
  }

  renderPauseButton(view) {
    if (!view.showPause()) return null;
    return (
      <button className="btn btn-sm btn-outline-warning" onClick={() => view.handlePause()}>
        Pause
      </button>
    );
  }

  renderStopButton(view) {
    if (!view.showStop()) return null;
    return (
      <button className="btn btn-sm btn-outline-danger" onClick={() => view.handleStop()}>
        Stop
      </button>
    );
  }

  renderRestartButton(view) {
    if (!view.showRestart()) return null;
    return (
      <button className="btn btn-sm btn-outline-primary" onClick={() => view.handleRestart()}>
        Restart
      </button>
    );
  }

  renderContinueButton(view) {
    if (!view.showContinue()) return null;
    return (
      <button className="btn btn-sm btn-outline-success" onClick={() => view.handleContinue()}>
        Continue
      </button>
    );
  }

  renderStartButton(view) {
    if (!view.showStart()) return null;
    return (
      <button className="btn btn-sm btn-outline-success" onClick={() => view.handleStart()}>
        Start
      </button>
    );
  }

  renderShutdownButton(view) {
    if (!view.showShutdown()) return null;
    return (
      <button className="btn btn-sm btn-danger" onClick={() => view.handleShutdown()}>
        Shut Down
      </button>
    );
  }

  render(view) {
    return (
      <div className="d-flex align-items-center gap-2">
        <span className="fw-semibold small">Engine</span>
        {view.isTransitioning() && this.renderSpinner()}
        <div className="d-flex gap-1">
          {this.renderPauseButton(view)}
          {this.renderStopButton(view)}
          {this.renderRestartButton(view)}
          {this.renderContinueButton(view)}
          {this.renderStartButton(view)}
          {this.renderShutdownButton(view)}
        </div>
      </div>
    );
  }
}

export default EngineControlsHelper;
