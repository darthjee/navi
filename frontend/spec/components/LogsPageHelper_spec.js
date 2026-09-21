import LogsPageHelper from '../../src/components/pages/helpers/LogsPageHelper.jsx';
import { itBehavesLikeLogsHelper } from '../support/logs.js';

describe('LogsPageHelper', () => {
  itBehavesLikeLogsHelper(LogsPageHelper);
});
