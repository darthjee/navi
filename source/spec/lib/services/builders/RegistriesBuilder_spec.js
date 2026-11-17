import { Job, JobFactory, JobRegistry, WorkersRegistry } from 'deku-swarm';
import { EmitJob } from '../../../../lib/jobs/EmitJob.js';
import { Config } from '../../../../lib/models/configs/Config.js';
import { RegistriesBuilder } from '../../../../lib/services/builders/RegistriesBuilder.js';
import { ResourceRequestEmitFactory } from '../../../support/factories/ResourceRequestEmitFactory.js';
import { FixturesUtils } from '../../../support/utils/FixturesUtils.js';
import { LoggerUtils } from '../../../support/utils/LoggerUtils.js';
import { RegistryCleanupUtils } from '../../../support/utils/RegistryCleanupUtils.js';

describe('RegistriesBuilder', () => {
  let builder;
  let config;

  beforeEach(() => {
    builder = new RegistriesBuilder();
    config = Config.fromFile(FixturesUtils.getFixturePath('config/sample_config.yml'));
  });

  afterEach(() => {
    RegistryCleanupUtils.resetApplicationState();
  });

  describe('#build', () => {
    it('initializes the job registry', () => {
      builder.build({ config });

      expect(() => JobRegistry.hasJob()).not.toThrow();
    });

    ['ResourceRequestJob', 'Action', 'PaginatedAction', 'HtmlParse', 'AssetDownload', 'Extraction', 'Emit'].forEach((factoryName) => {
      it(`registers the ${factoryName} factory`, () => {
        builder.build({ config });

        expect(JobFactory.get(factoryName)).toBeDefined();
      });
    });

    it('initializes workers using the configured quantity', () => {
      builder.build({ config });

      expect(WorkersRegistry.stats().idle).toEqual(5);
    });

    describe('retention forwarding', () => {
      it('passes retention to JobRegistry.ensureBuild when set', () => {
        config.workersConfig.retention = { finished: 2 };
        spyOn(JobRegistry, 'ensureBuild').and.callThrough();

        builder.build({ config });

        expect(JobRegistry.ensureBuild).toHaveBeenCalledWith({
          cooldown: config.workersConfig.retryCooldown,
          maxRetries: config.workersConfig.maxRetries,
          retention: { finished: 2 },
        });
      });

      it('passes no retention key when omitted', () => {
        config.workersConfig.retention = undefined;
        spyOn(JobRegistry, 'ensureBuild').and.callThrough();

        builder.build({ config });

        expect(JobRegistry.ensureBuild).toHaveBeenCalledWith({
          cooldown: config.workersConfig.retryCooldown,
          maxRetries: config.workersConfig.maxRetries,
        });
      });

      it('builds the real JobRegistry with a valid retention', () => {
        config.workersConfig.retention = { finished: 2 };

        expect(() => builder.build({ config })).not.toThrow();
      });

      it('throws on an invalid retention key', () => {
        config.workersConfig.retention = { finshed: 2 };

        expect(() => builder.build({ config })).toThrowError(/Invalid retention key/);
      });

      it('passes exactly factory and quantity to WorkersRegistry.ensureBuild', () => {
        spyOn(WorkersRegistry, 'ensureBuild').and.callThrough();

        builder.build({ config });

        const args = WorkersRegistry.ensureBuild.calls.mostRecent().args[0];
        expect(Object.keys(args).sort()).toEqual(['factory', 'quantity']);
      });
    });

    describe('global maxRetries/cooldown injection', () => {
      beforeEach(() => {
        builder.build({ config });
      });

      it('injects the global maxRetries/cooldown into the ResourceRequestJob factory', () => {
        const job = JobFactory.get('ResourceRequestJob').build({
          id: 'job-1', resourceRequest: {}, parameters: {}, clients: config.namespaceMap,
        });

        expect(job.maxRetries).toBe(config.workersConfig.maxRetries);
        expect(job.cooldown).toBe(config.workersConfig.retryCooldown);
      });

      it('injects the global maxRetries/cooldown into the AssetDownload factory', () => {
        const job = JobFactory.get('AssetDownload').build({
          id: 'job-1', url: '/asset', status: 200, clientRegistry: config.namespaceMap,
        });

        expect(job.maxRetries).toBe(config.workersConfig.maxRetries);
        expect(job.cooldown).toBe(config.workersConfig.retryCooldown);
      });

      it('does not inject the global maxRetries/cooldown into the Emit factory', () => {
        const emit = ResourceRequestEmitFactory.build({ url: '/emit' });
        const job = JobFactory.get('Emit').build({
          id: 'job-1', item: {}, emit, parameters: {}, clients: config.namespaceMap,
        });

        expect(job.maxRetries).toBe(EmitJob.DEFAULT_MAX_RETRIES);
        expect(job.cooldown).toBe(EmitJob.DEFAULT_COOLDOWN);
      });
    });

    describe('onWorkerIdle', () => {
      const buildJob = (perform) => {
        const job = new Job({ id: 'job-1', maxRetries: 1, cooldown: 0 });
        job.perform = perform;
        return job;
      };

      beforeEach(() => {
        LoggerUtils.stubLoggerMethods();
      });

      it('calls the hook after a successful job', async () => {
        const onWorkerIdle = jasmine.createSpy('onWorkerIdle');
        builder.build({ config, onWorkerIdle });
        const worker = WorkersRegistry.getIdleWorker();
        worker.assign(buildJob(() => Promise.resolve()));

        await worker.perform();

        expect(onWorkerIdle).toHaveBeenCalledTimes(1);
      });

      it('calls the hook after a failing job', async () => {
        const onWorkerIdle = jasmine.createSpy('onWorkerIdle');
        builder.build({ config, onWorkerIdle });
        const worker = WorkersRegistry.getIdleWorker();
        worker.assign(buildJob(() => Promise.reject(new Error('boom'))));

        await worker.perform();

        expect(onWorkerIdle).toHaveBeenCalledTimes(1);
      });

      it('does not throw when the hook is omitted', async () => {
        builder.build({ config });
        const worker = WorkersRegistry.getIdleWorker();
        worker.assign(buildJob(() => Promise.resolve()));

        await expectAsync(worker.perform()).toBeResolved();
      });
    });
  });
});
