import { ActionProcessingJob } from '../../../lib/jobs/ActionProcessingJob.js';
import { ActionJobExamples } from '../../support/utils/ActionJobExamples.js';

describe('ActionProcessingJob', () => {
  ActionJobExamples.register({
    jobClass: ActionProcessingJob,
    actionKey: 'action',
    actionLabel: 'action',
    buildInputs: () => ({ item: { id: 1, name: 'Electronics' } }),
    expectedExecuteArguments: ({ item }) => [item],
    argumentsDescription: 'returns the item',
    executeDescription: 'calls action.execute with the item',
  });
});
