import { RegistryCleanupUtils } from './RegistryCleanupUtils.js';
import { JobFactory } from '../../../lib/background/JobFactory.js';
import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/background/WorkersRegistry.js';
import { IdentifyableCollection } from '../../../lib/collections/IdentifyableCollection.js';
import { Engine } from '../../../lib/services/Engine.js';
import { DummyJobFactory } from '../dummies/factories/DummyJobFactory.js';
import { DummyWorkerFactory } from '../dummies/factories/DummyWorkerFactory.js';
import { DummyJob } from '../dummies/models/DummyJob.js';

/**
 * Test utility shared by the Engine spec files.
 *
 * Specs call {@link EngineSpecUtils.setup} inside their top-level describe
 * and read the engine, finished, dead, busy, jobFactory and workerFactory
 * from the returned context object, which is refreshed on every beforeEach.
 */
class EngineSpecUtils {
  /**
   * Enqueues the given number of ResourceRequestJob jobs.
   * @param {number} count - Number of jobs to enqueue.
   * @returns {void}
   */
  static enqueueJobs(count) {
    for (let i = 0; i < count; i++) {
      JobRegistry.enqueue('ResourceRequestJob', { resourceRequest: {}, parameters: {} });
    }
  }

  /**
   * Builds an Engine wired to the JobRegistry / WorkersRegistry facades.
   * @param {object} [options={}] - Extra Engine options, overriding the defaults.
   * @returns {Engine} The engine.
   */
  static buildEngine(options = {}) {
    return new Engine({
      jobRegistry: JobRegistry,
      workersRegistry: WorkersRegistry,
      sleepMs: -1,
      ...options,
    });
  }

  /**
   * Installs the common beforeEach (registries and engine build) and
   * afterEach (registries reset) and returns the mutable context object
   * refreshed by them. The context also exposes `rebuild(options)`, which
   * resets the registries and rebuilds them with the merged options.
   * @param {object} [defaults={}] - Default options passed to {@link EngineSpecUtils.build}.
   * @returns {object} The spec context.
   */
  static setup(defaults = {}) {
    const ctx = {
      rebuild: (options = {}) => {
        RegistryCleanupUtils.resetEngineState();
        EngineSpecUtils.build(ctx, { ...defaults, ...options });
      },
    };

    beforeEach(() => {
      EngineSpecUtils.build(ctx, defaults);
    });

    afterEach(() => {
      RegistryCleanupUtils.resetEngineState();
    });

    return ctx;
  }

  /**
   * Builds the collections, factories, registries and engine into the context.
   * @param {object} ctx - The spec context to fill.
   * @param {object} [options={}] - Build options.
   * @param {number} [options.cooldown=-1] - JobRegistry cooldown.
   * @param {IdentifyableCollection|Function} [options.workers] - Workers collection for WorkersRegistry,
   *   or a function of ctx returning a fresh one (so each build gets its own collection).
   * @param {object|Function} [options.engineOptions={}] - Engine options, or a function of ctx returning them.
   * @returns {void}
   */
  static build(ctx, { cooldown = -1, workers, engineOptions = {} } = {}) {
    ctx.finished = new IdentifyableCollection();
    ctx.dead = new IdentifyableCollection();
    ctx.busy = new IdentifyableCollection();
    ctx.jobFactory = new DummyJobFactory();
    ctx.workerFactory = new DummyWorkerFactory({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry });

    const workersCollection = typeof workers === 'function' ? workers(ctx) : workers;

    JobFactory.registry('ResourceRequestJob', ctx.jobFactory);
    JobRegistry.build({ finished: ctx.finished, dead: ctx.dead, cooldown });
    WorkersRegistry.build({
      busy: ctx.busy,
      quantity: 2,
      factory: ctx.workerFactory,
      ...(workersCollection ? { workers: workersCollection } : {}),
    });
    WorkersRegistry.initWorkers();
    DummyJob.setSuccessRate(1);

    const options = typeof engineOptions === 'function' ? engineOptions(ctx) : engineOptions;
    ctx.engine = EngineSpecUtils.buildEngine(options);
  }

  /**
   * Spies JobRegistry.promoteReadyJobs so that it counts engine loop
   * iterations and stops the engine once the limit is reached.
   * @param {Engine} engine - The engine to stop.
   * @param {object} [options={}] - Options.
   * @param {number} [options.limit] - Iteration count at which the engine is stopped.
   * @param {Function} [options.onIteration] - Called with the current count on every iteration.
   * @returns {{count: number}} The iteration counter.
   */
  static stopAfterIterations(engine, { limit, onIteration } = {}) {
    const counter = { count: 0 };

    spyOn(JobRegistry, 'promoteReadyJobs').and.callFake(() => {
      counter.count++;
      if (onIteration) onIteration(counter.count);
      if (limit !== undefined && counter.count >= limit) engine.stop();
    });

    return counter;
  }
}

export { EngineSpecUtils };
