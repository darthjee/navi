import { JobFactory, JobRegistry, WorkersRegistry } from 'deku-swarm';
import { EmitJob } from '../../../../lib/jobs/EmitJob.js';
import { Config } from '../../../../lib/models/configs/Config.js';
import { RegistriesBuilder } from '../../../../lib/services/builders/RegistriesBuilder.js';
import { ResourceRequestEmitFactory } from '../../../support/factories/ResourceRequestEmitFactory.js';
import { FixturesUtils } from '../../../support/utils/FixturesUtils.js';
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
  });
});
