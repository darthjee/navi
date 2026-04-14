import { Config } from '../../../lib/models/Config.js';
import { WorkersConfig } from '../../../lib/models/WorkersConfig.js';
import { ResourceRegistry } from '../../../lib/registry/ResourceRegistry.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { ClientRegistryFactory } from '../../support/factories/ClientRegistryFactory.js';
import { ResourceFactory } from '../../support/factories/ResourceFactory.js';
import { FixturesUtils } from '../../support/utils/FixturesUtils.js';

describe('Config', () => {
  let expectedResources;
  let expectedClients;
  let expectedClientRegistry;
  let expectedResourceRegistry;
  let expectedWorkersConfig;

  afterEach(() => {
    ResourceRegistry.reset();
  });

  describe('.fromFile', () => {
    describe('when the yaml file is valid', () => {
      beforeEach(() => {
        expectedResources = {
          categories: ResourceFactory.build(),
        };
        expectedClients = {
          default: ClientFactory.build({ timeout: 5000 }),
        };
        expectedClientRegistry = ClientRegistryFactory.build(expectedClients);
        expectedResourceRegistry = new ResourceRegistry(expectedResources);
        expectedWorkersConfig = new WorkersConfig({ quantity: 5 });
      });

      it('returns a Config instance with resources from yaml file', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/sample_config.yml');

        const config = Config.fromFile(configFilePath);

        expect(config instanceof Config).toBeTrue();
        expect(config.resourceRegistry).toEqual(expectedResourceRegistry);
        expect(config.clientRegistry).toEqual(expectedClientRegistry);
        expect(config.workersConfig).toEqual(expectedWorkersConfig);
      });
    });

    describe('when the yaml file does not contain clients key', () => {
      it('throws an error', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/missing_clients_sample_config.yml');

        expect(() => Config.fromFile(configFilePath)).toThrowError(
          'Invalid config file: expected a top-level "clients" key.',
        );
      });
    });

    describe('when the yaml file does not contain resources key', () => {
      it('throws an error', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/missing_resources_sample_config.yml');

        expect(() => Config.fromFile(configFilePath)).toThrowError(
          'Invalid config file: expected a top-level "resources" key.',
        );
      });
    });
  });
});
