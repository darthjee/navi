import StatusTab from './StatusTab.jsx';
import { STATUSES } from '../../clients/JobsClient.js';

function StatusTabs({ status, filterQuery }) {
  return (
    <ul className="nav nav-tabs mb-3">
      {STATUSES.map((s) => (
        <StatusTab key={s} s={s} status={status} filterQuery={filterQuery} />
      ))}
    </ul>
  );
}

export default StatusTabs;
