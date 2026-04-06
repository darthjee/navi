import { ConfigurationFileNotFound } from '../../lib/exceptions/ConfigurationFileNotFound.js';
import { WorkersConfig } from '../../lib/models/WorkersConfig.js';
import { ConfigLoader } from '../../lib/services/ConfigLoader.js';
import { Logger } from '../../lib/utils/Logger.js';
import { ClientFactory } from '../support/factories/ClientFactory.js';
import { ResourceFactory } from '../support/factories/ResourceFactory.js';
import { FixturesUtils } from '../support/utils/FixturesUtils.js';

describe('ConfigLoader', () => {
  let expectedResources;
  let expectedClients;
  let expectedWorkersConfig;

  describe('.fromFile', () => {
    describe('when the yaml file is valid', () => {
      let config;

      beforeEach(() => {
        expectedResources = {
          categories: ResourceFactory.build(),
        };
        expectedClients = {
          default: ClientFactory.build({ timeout: 5000 }),
        };
        expectedWorkersConfig = new WorkersConfig({ quantity: 5 });

        const configFilePath = FixturesUtils.getFixturePath('config/sample_config.yml');
        config = ConfigLoader.fromFile(configFilePath);
      });

      it('returns mapped resources by name', () => {
        expect(config.resources).toEqual(expectedResources);
      });

      it('returns mapped clients by name', () => {
        expect(config.clients).toEqual(expectedClients);
      });

      it('returns workers configuration', () => {
        expect(config.workersConfig).toEqual(expectedWorkersConfig);
      });
    });

    describe('when the yaml misses workers definition', () => {
      let config;

      beforeEach(() => {
        expectedResources = {
          categories: ResourceFactory.build(),
        };
        expectedClients = {
          default: ClientFactory.build(),
        };
        expectedWorkersConfig = new WorkersConfig({ quantity: 1 });

        const configFilePath = FixturesUtils.getFixturePath('config/missing_workers_config.yml');
        config = ConfigLoader.fromFile(configFilePath);
      });

      it('returns mapped resources by name', () => {
        expect(config.resources).toEqual(expectedResources);
      });

      it('returns mapped clients by name', () => {
        expect(config.clients).toEqual(expectedClients);
      });

      it('returns workers default configuration', () => {
        expect(config.workersConfig).toEqual(expectedWorkersConfig);
      });
    });

    describe('when the yaml file does not contain clients key', () => {
      it('throws an error', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/missing_clients_sample_config.yml');

        expect(() => ConfigLoader.fromFile(configFilePath)).toThrowError(
          'Invalid config file: expected a top-level "clients" key.',
        );
      });
    });

    describe('when the yaml file does not contain resources key', () => {
      it('throws an error', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/missing_resources_sample_config.yml');

        expect(() => ConfigLoader.fromFile(configFilePath)).toThrowError(
          'Invalid config file: expected a top-level "resources" key.',
        );
      });
    });

    describe('when the file is not found', () => {
      beforeEach(() => {
        spyOn(Logger, 'error').and.stub();
      });

      it('throws an error and logs it', () => {
        const configFilePath = FixturesUtils.getFixturePath('non-existing.yml');

        expect(() => ConfigLoader.fromFile(configFilePath)).toThrowError(
          ConfigurationFileNotFound
        );
        expect(Logger.error).toHaveBeenCalled();
      });
    });
  });
});
