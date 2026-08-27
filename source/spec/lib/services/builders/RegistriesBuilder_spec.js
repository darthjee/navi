import { JobFactory, JobRegistry, IdentifyableCollection } from 'deku-swarm';
import { Config } from '../../../../lib/models/configs/Config.js';
import { RegistriesBuilder } from '../../../../lib/services/builders/RegistriesBuilder.js';
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
      const workers = new IdentifyableCollection();

      builder.build({ config, workers });

      expect(workers.size()).toEqual(5);
    });
  });
});
