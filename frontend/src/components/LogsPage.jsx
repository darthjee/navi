import Logs from './Logs.jsx';
import fetchLogs from '../clients/LogsClient.js';

function LogsPage() {
  return <Logs fetchLogs={fetchLogs} />;
}

export default LogsPage;
