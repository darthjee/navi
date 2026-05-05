import ContinueButton from '../ContinueButton.jsx';
import PauseButton from '../PauseButton.jsx';
import RestartButton from '../RestartButton.jsx';
import ShutdownButton from '../ShutdownButton.jsx';
import StartButton from '../StartButton.jsx';
import StopButton from '../StopButton.jsx';
import TransitionSpinner from '../TransitionSpinner.jsx';

class EngineControlsHelper {
  renderSpinner() {
    return <TransitionSpinner />;
  }

  renderPauseButton(view) {
    return <PauseButton show={view.showPause()} onClick={() => view.handlePause()} />;
  }

  renderStopButton(view) {
    return <StopButton show={view.showStop()} onClick={() => view.handleStop()} />;
  }

  renderRestartButton(view) {
    return <RestartButton show={view.showRestart()} onClick={() => view.handleRestart()} />;
  }

  renderContinueButton(view) {
    return <ContinueButton show={view.showContinue()} onClick={() => view.handleContinue()} />;
  }

  renderStartButton(view) {
    return <StartButton show={view.showStart()} onClick={() => view.handleStart()} />;
  }

  renderShutdownButton(view) {
    return <ShutdownButton show={view.showShutdown()} onClick={() => view.handleShutdown()} />;
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
