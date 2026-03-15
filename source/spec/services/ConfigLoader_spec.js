import { ConfigurationFileNotFound } from '../../lib/exceptions/ConfigurationFileNotFound.js';
import { Resource } from '../../lib/models/Resource.js';
import { ResourceRequest } from '../../lib/models/ResourceRequest.js';
import { WorkersConfig } from '../../lib/models/WorkersConfig.js';
import { Client } from '../../lib/services/Client.js';
import { ConfigLoader } from '../../lib/services/ConfigLoader.js';
import { FixturesUtils } from '../support/utils/FixturesUtils.js';

describe('ConfigLoader', () => {
  let expectedResources;
  let expectedClients;
  let expectedResourceRequests;
  let expectedWorkersConfig;

  describe('.fromFile', () => {
    describe('when the yaml file is valid', () => {
      beforeEach(() => {
        expectedResourceRequests = [
          new ResourceRequest({ url: '/categories.json', status: 200 })
        ];
        expectedResources = {
          categories: new Resource({
            name: 'categories', resourceRequests: expectedResourceRequests
          }),
        };
        expectedClients = {
          default: new Client({ name: 'default', baseUrl: 'https://example.com' }),
        };
        expectedWorkersConfig = new WorkersConfig({ quantity: 5 });
      });

      it('returns mapped resources by name', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/sample_config.yml');

        const config = ConfigLoader.fromFile(configFilePath);

        expect(config.resources).toEqual(expectedResources);
      });

      it('returns mapped clients by name', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/sample_config.yml');

        const config = ConfigLoader.fromFile(configFilePath);

        expect(config.clients).toEqual(expectedClients);
      });

      it('returns workers configuration', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/sample_config.yml');

        const config = ConfigLoader.fromFile(configFilePath);

        expect(config.workersConfig).toEqual(expectedWorkersConfig);
      });
    });

    describe('when the yaml misses workers definition', () => {
      beforeEach(() => {
        expectedResourceRequests = [
          new ResourceRequest({ url: '/categories.json', status: 200 })
        ];
        expectedResources = {
          categories: new Resource({
            name: 'categories', resourceRequests: expectedResourceRequests
          }),
        };
        expectedClients = {
          default: new Client({ name: 'default', baseUrl: 'https://example.com' }),
        };
        expectedWorkersConfig = new WorkersConfig({ quantity: 1 });
      });

      it('returns mapped resources by name', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/missing_workers_config.yml');

        const config = ConfigLoader.fromFile(configFilePath);

        expect(config.resources).toEqual(expectedResources);
      });

      it('returns mapped clients by name', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/missing_workers_config.yml');

        const config = ConfigLoader.fromFile(configFilePath);

        expect(config.clients).toEqual(expectedClients);
      });

      it('returns workers default configuration', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/missing_workers_config.yml');

        const config = ConfigLoader.fromFile(configFilePath);

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
      it('throws an error', () => {
        const configFilePath = FixturesUtils.getFixturePath('non-existing.yml');

        expect(() => ConfigLoader.fromFile(configFilePath)).toThrowError(
          ConfigurationFileNotFound
        );
      });
    });
  });
});
