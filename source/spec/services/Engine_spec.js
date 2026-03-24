import { Engine } from '../../lib/services/Engine.js';
import { DummyJob } from '../support/models/DummyJob.js';
import { DummyJobFactory } from '../support/factories/DummyJobFactory.js';
import { JobRegistry } from '../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../lib/registry/WorkersRegistry.js';

describe('Engine', () => {
  let engine;
  let jobFactory;
  let jobRegistry;
  let workersRegistry;

  beforeEach(() => {
    jobFactory = new DummyJobFactory();
    jobRegistry = new JobRegistry({ factory: jobFactory });

    workersRegistry = new WorkersRegistry();

    engine = new Engine({ jobRegistry, workersRegistry });
  });
});