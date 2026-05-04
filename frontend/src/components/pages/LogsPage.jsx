import fetchLogs from '../../clients/LogsClient.js';
import Logs from '../elements/Logs.jsx';

function LogsPage() {
  return <Logs fetchLogs={fetchLogs} />;
}

export default LogsPage;
