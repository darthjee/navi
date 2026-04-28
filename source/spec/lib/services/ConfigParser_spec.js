import { MissingClientsConfig } from '../../../lib/exceptions/MissingClientsConfig.js';
import { MissingResourceConfig } from '../../../lib/exceptions/MissingResourceConfig.js';
import { FailureConfig } from '../../../lib/models/FailureConfig.js';
import { LogConfig } from '../../../lib/models/LogConfig.js';
import { WebConfig } from '../../../lib/models/WebConfig.js';
import { WorkersConfig } from '../../../lib/models/WorkersConfig.js';
import { ConfigParser } from '../../../lib/services/ConfigParser.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { ResourceFactory } from '../../support/factories/ResourceFactory.js';
import { FixturesUtils } from '../../support/utils/FixturesUtils.js';

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
          default: ClientFactory.build({ timeout: 5000 }),
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

    describe('when client config has no timeout', () => {
      beforeEach(() => {
        config = FixturesUtils.loadYamlFixture('config/sample_config_without_timeout.yml');
      });

      it('returns a client with the default timeout of 5000ms', () => {
        const result = ConfigParser.fromObject(config);

        expect(result.clients).toEqual({
          default: ClientFactory.build({ timeout: 5000 }),
        });
      });
    });

    describe('when workers config includes retry_cooldown', () => {
      beforeEach(() => {
        config = FixturesUtils.loadYamlFixture('config/sample_config_with_retry_cooldown.yml');
      });

      it('returns a WorkersConfig with the configured retry cooldown', () => {
        const result = ConfigParser.fromObject(config);

        expect(result.workersConfig).toEqual(
          new WorkersConfig({ quantity: 5, retry_cooldown: 3000 })
        );
      });
    });

    describe('when workers config includes sleep', () => {
      beforeEach(() => {
        config = FixturesUtils.loadYamlFixture('config/sample_config_with_sleep.yml');
      });

      it('returns a WorkersConfig with the configured sleep', () => {
        const result = ConfigParser.fromObject(config);

        expect(result.workersConfig).toEqual(
          new WorkersConfig({ quantity: 5, sleep: 200 })
        );
      });
    });

    describe('when workers config includes max-retries', () => {
      beforeEach(() => {
        config = FixturesUtils.loadYamlFixture('config/sample_config_with_max_retries.yml');
      });

      it('returns a WorkersConfig with the configured maxRetries', () => {
        const result = ConfigParser.fromObject(config);

        expect(result.workersConfig).toEqual(
          new WorkersConfig({ quantity: 5, 'max-retries': 5 })
        );
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

    describe('when the config has web configuration', () => {
      beforeEach(() => {
        config = FixturesUtils.loadYamlFixture('config/sample_config_with_web.yml');
      });

      it('returns a WebConfig', () => {
        const result = ConfigParser.fromObject(config);
        expect(result.webConfig).toEqual(jasmine.objectContaining({ port: 3000 }));
      });

      it('returns a WebConfig instance', () => {
        const result = ConfigParser.fromObject(config);
        expect(result.webConfig instanceof WebConfig).toBeTrue();
      });
    });

    describe('when the config has no web key', () => {
      beforeEach(() => {
        config = FixturesUtils.loadYamlFixture('config/sample_config.yml');
      });

      it('returns null for webConfig', () => {
        const result = ConfigParser.fromObject(config);
        expect(result.webConfig).toBeNull();
      });
    });

    describe('when client config includes headers', () => {
      beforeEach(() => {
        config = FixturesUtils.loadYamlFixture('config/sample_config_with_headers.yml');
      });

      it('returns clients with parsed headers', () => {
        const result = ConfigParser.fromObject(config);

        expect(result.clients.auth_api.headers).toEqual({
          Authorization: 'Bearer my-token',
          'X-Custom-Header': 'custom-value',
        });
      });

      it('returns a client without headers as empty object', () => {
        const result = ConfigParser.fromObject(config);

        expect(result.clients.default.headers).toEqual({});
      });
    });

    describe('when the config has a log key', () => {
      beforeEach(() => {
        config = FixturesUtils.loadYamlFixture('config/sample_config_with_log.yml');
      });

      it('returns a LogConfig instance', () => {
        const result = ConfigParser.fromObject(config);
        expect(result.logConfig instanceof LogConfig).toBeTrue();
      });

      it('returns a LogConfig with the configured size', () => {
        const result = ConfigParser.fromObject(config);
        expect(result.logConfig.size).toBe(50);
      });
    });

    describe('when the config has no log key', () => {
      beforeEach(() => {
        config = FixturesUtils.loadYamlFixture('config/sample_config.yml');
      });

      it('returns a LogConfig with the default size', () => {
        const result = ConfigParser.fromObject(config);
        expect(result.logConfig.size).toBe(100);
      });
    });

    describe('when the config has a failure key', () => {
      beforeEach(() => {
        config = FixturesUtils.loadYamlFixture('config/sample_config_with_failure.yml');
      });

      it('returns a FailureConfig instance', () => {
        const result = ConfigParser.fromObject(config);
        expect(result.failureConfig instanceof FailureConfig).toBeTrue();
      });

      it('returns a FailureConfig with the configured threshold', () => {
        const result = ConfigParser.fromObject(config);
        expect(result.failureConfig.threshold).toBe(10.0);
      });
    });

    describe('when the config has no failure key', () => {
      beforeEach(() => {
        config = FixturesUtils.loadYamlFixture('config/sample_config.yml');
      });

      it('returns null for failureConfig', () => {
        const result = ConfigParser.fromObject(config);
        expect(result.failureConfig).toBeNull();
      });
    });
  });
});
