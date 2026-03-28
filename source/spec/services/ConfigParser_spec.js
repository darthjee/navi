import { MissingClientsConfig } from '../../lib/exceptions/MissingClientsConfig.js';
import { MissingResourceConfig } from '../../lib/exceptions/MissingResourceConfig.js';
import { WorkersConfig } from '../../lib/models/WorkersConfig.js';
import { ConfigParser } from '../../lib/services/ConfigParser.js';
import { ClientFactory } from '../support/factories/ClientFactory.js';
import { ResourceFactory } from '../support/factories/ResourceFactory.js';
import { FixturesUtils } from '../support/utils/FixturesUtils.js';

describe('ConfigParser', () => {
  let expectedResources;
  let expectedClients;
  let expectedWorkersConfig;
  let config;

  describe('.fromObject', () => {
    describe('when the config object is valid', () => {
      beforeEach(() => {
        config = FixturesUtils.loadYamlFixture('config/sample_config.yml');

        expectedResources = {
          categories: ResourceFactory.build(),
        };
        expectedClients = {
          default: ClientFactory.build(),
        };
        expectedWorkersConfig = new WorkersConfig({ quantity: 5 });
      });

      it('returns mapped resources by name', () => {
        const result = ConfigParser.fromObject(config);

        expect(result.resources).toEqual(expectedResources);
      });

      it('returns mapped clients by name', () => {
        const result = ConfigParser.fromObject(config);

        expect(result.clients).toEqual(expectedClients);
      });

      it('returns workers configuration', () => {
        const result = ConfigParser.fromObject(config);

        expect(result.workersConfig).toEqual(expectedWorkersConfig);
      });
    });

    describe('when the config object does not contain a clients key', () => {
      beforeEach(() => {
        config = FixturesUtils.loadYamlFixture('config/missing_clients_sample_config.yml');
      });

      it('throws an error', () => {
        expect(() => ConfigParser.fromObject(config)).toThrowError(
          MissingClientsConfig, 'Invalid config file: expected a top-level "clients" key.',
        );
      });
    });

    describe('when the config object does not contain a resources key', () => {
      beforeEach(() => {
        config = FixturesUtils.loadYamlFixture('config/missing_resources_sample_config.yml');
      });

      it('throws an error', () => {
        expect(() => ConfigParser.fromObject(config)).toThrowError(
          MissingResourceConfig, 'Invalid config file: expected a top-level "resources" key.',
        );
      });
    });

    describe('when the config object does not contain a workers key', () => {
      beforeEach(() => {
        config = FixturesUtils.loadYamlFixture('config/missing_workers_config.yml');
      });

      beforeEach(() => {
        expectedResources = {
          categories: ResourceFactory.build(),
        };
        expectedClients = {
          default: ClientFactory.build(),
        };
        expectedWorkersConfig = new WorkersConfig({ quantity: 1 });
      });

      it('returns mapped resources by name', () => {
        const result = ConfigParser.fromObject(config);

        expect(result.resources).toEqual(expectedResources);
      });

      it('returns mapped clients by name', () => {
        const result = ConfigParser.fromObject(config);

        expect(result.clients).toEqual(expectedClients);
      });

      it('returns default workers configuration', () => {
        const result = ConfigParser.fromObject(config);

        expect(result.workersConfig).toEqual(expectedWorkersConfig);
      });
    });

    describe('when the config object is null', () => {
      it('throws an error for missing resources key', () => {
        expect(() => ConfigParser.fromObject(null)).toThrowError(
          'Invalid config file: expected a top-level "resources" key.',
        );
      });
    });
  });
});
