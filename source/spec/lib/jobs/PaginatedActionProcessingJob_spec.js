import { PaginatedActionProcessingJob } from '../../../lib/jobs/PaginatedActionProcessingJob.js';
import { ActionJobExamples } from '../../support/utils/ActionJobExamples.js';

describe('PaginatedActionProcessingJob', () => {
  ActionJobExamples.register({
    jobClass: PaginatedActionProcessingJob,
    actionKey: 'paginatedAction',
    actionLabel: 'paginated action',
    buildInputs: () => ({
      responseWrapper: { parsedBody: { id: 1 }, headers: {} },
      parameters: { category_id: 5 },
    }),
    expectedExecuteArguments: ({ responseWrapper, parameters }) => [responseWrapper, parameters],
    argumentsDescription: 'returns the responseWrapper and parameters',
    executeDescription: 'calls paginatedAction.execute with the responseWrapper and parameters',
  });
});
