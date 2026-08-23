import { colorForMemoryStatus } from '../../../constants/memoryStatus.js';
import formatBytes from '../../../utils/formatBytes.js';
import formatPercentage from '../../../utils/formatPercentage.js';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LoadingSpinner from '../../elements/LoadingSpinner.jsx';

class MemoryStatusHelper {
  static renderLoading() {
    return <LoadingSpinner message="Loading memory status…" />;
  }

  static renderError(error) {
    return <ErrorAlert error={error} prefix="Failed to load memory status" />;
  }

  static render({ current, maximum, percentage, status }) {
    const color = colorForMemoryStatus(status, percentage);

    return (
      <div className="card">
        <div className="card-body">
          <h5 className={`card-title ${color}`}>Status: {status}</h5>
          <p className="card-text mb-0">
            {formatBytes(current)} / {formatBytes(maximum)} ({formatPercentage(percentage)}%)
          </p>
        </div>
      </div>
    );
  }
}

export default MemoryStatusHelper;
