import { JobFactory } from '../../../lib/background/JobFactory.js';
import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/background/WorkersRegistry.js';
import { Engine } from '../../../lib/services/Engine.js';
import { IdentifyableCollection } from '../../../lib/utils/collections/IdentifyableCollection.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { DummyJobFactory } from '../../support/dummies/factories/DummyJobFactory.js';
import { DummyWorkerFactory } from '../../support/dummies/factories/DummyWorkerFactory.js';
import { DummyJob } from '../../support/dummies/models/DummyJob.js';
import { DummyWorkersAllocator } from '../../support/dummies/services/DummyWorkersAllocator.js';
import { RegistryCleanupUtils } from '../../support/utils/RegistryCleanupUtils.js';

describe('Engine asynchronous job handling', () => {
  let busy;
  let dead;
  let engine;
  let finished;
  let workerFactory;

  const enqueueJobs = (count) => {
    for (let i = 0; i < count; i++) {
      JobRegistry.enqueue('ResourceRequestJob', { resourceRequest: {}, parameters: {} });
    }
  };

  const stubWorkersRegistryIdleCheck = () => {
    spyOn(WorkersRegistry, 'hasIdleWorker').and.callFake(() => {
      const hasIdleWorker = WorkersRegistry.hasIdleWorker.and.originalFn.call(WorkersRegistry);

      if (!hasIdleWorker || !JobRegistry.hasJob()) {
        busy.list().forEach((worker) => worker.perform());
      }

      return hasIdleWorker;
    });
  };

  beforeEach(() => {
    Logger.suppress();
    finished = new IdentifyableCollection();
    dead = new IdentifyableCollection();
    busy = new IdentifyableCollection();
    workerFactory = new DummyWorkerFactory({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry });

    JobFactory.registry('ResourceRequestJob', new DummyJobFactory());
    JobRegistry.build({ finished, dead, cooldown: -1 });
    WorkersRegistry.build({
      busy,
      quantity: 2,
      workers: new IdentifyableCollection(),
      factory: workerFactory,
    });
    WorkersRegistry.initWorkers();
    engine = new Engine({ allocator: new DummyWorkersAllocator(), sleepMs: -1 });
  });

  afterEach(() => {
    RegistryCleanupUtils.resetEngineState();
  });

  describe('#start', () => {
    describe('when jobs take some time to be processed', () => {
      beforeEach(() => {
        DummyJob.setSuccessRate(0.1);
        stubWorkersRegistryIdleCheck();
        enqueueJobs(20);
      });

      it('clears the job queue', async () => {
        expect(JobRegistry.hasJob()).toBeTrue();

        await engine.start();

        expect(JobRegistry.hasJob()).toBeFalse();
      });

      it('moves every job to either finished or dead', async () => {
        await engine.start();

        expect(finished.size() + dead.size()).toBe(20);
      });
    });
  });
});
