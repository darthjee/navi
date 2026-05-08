import { MissingClientsConfig } from '../../../lib/exceptions/config/MissingClientsConfig.js';
import { MissingResourceConfig } from '../../../lib/exceptions/config/MissingResourceConfig.js';
import { FailureConfig } from '../../../lib/models/configs/FailureConfig.js';
import { LogConfig } from '../../../lib/models/configs/LogConfig.js';
import { WebConfig } from '../../../lib/models/configs/WebConfig.js';
import { WorkersConfig } from '../../../lib/models/configs/WorkersConfig.js';
import { ConfigParser } from '../../../lib/services/ConfigParser.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { ResourceFactory } from '../../support/factories/ResourceFactory.js';
import { FixturesUtils } from '../../support/utils/FixturesUtils.js';

const parseFixture = (fixtureName) => {
  return ConfigParser.fromObject(FixturesUtils.loadYamlFixture(`config/${fixtureName}`));
};

const buildDefaultResources = () => {
  return { categories: ResourceFactory.build() };
};

describe('ConfigParser', () => {
  describe('.fromObject', () => {
    it('returns mapped resources by name for a valid config', () => {
      expect(parseFixture('sample_config.yml').resources).toEqual(buildDefaultResources());
    });

    [
      {
        description: 'valid config',
        fixtureName: 'sample_config.yml',
        expectedClients: { default: ClientFactory.build({ timeout: 5000 }) },
        expectedWorkersConfig: new WorkersConfig({ quantity: 5 }),
      },
      {
        description: 'client config has no timeout',
        fixtureName: 'sample_config_without_timeout.yml',
        expectedClients: { default: ClientFactory.build({ timeout: 5000 }) },
        expectedWorkersConfig: new WorkersConfig({ quantity: 5 }),
      },
      {
        description: 'config object does not contain a workers key',
        fixtureName: 'missing_workers_config.yml',
        expectedClients: { default: ClientFactory.build() },
        expectedWorkersConfig: new WorkersConfig({ quantity: 1 }),
      },
    ].forEach(({ description, fixtureName, expectedClients, expectedWorkersConfig }) => {
      describe(`when the ${description}`, () => {
        it('returns mapped clients by name', () => {
          expect(parseFixture(fixtureName).clients).toEqual(expectedClients);
        });

        it('returns the expected workers configuration', () => {
          expect(parseFixture(fixtureName).workersConfig).toEqual(expectedWorkersConfig);
        });
      });
    });

    [
      {
        description: 'workers config includes retry_cooldown',
        fixtureName: 'sample_config_with_retry_cooldown.yml',
        expectedWorkersConfig: new WorkersConfig({ quantity: 5, retry_cooldown: 3000 }),
      },
      {
        description: 'workers config includes sleep',
        fixtureName: 'sample_config_with_sleep.yml',
        expectedWorkersConfig: new WorkersConfig({ quantity: 5, sleep: 200 }),
      },
      {
        description: 'workers config includes max-retries',
        fixtureName: 'sample_config_with_max_retries.yml',
        expectedWorkersConfig: new WorkersConfig({ quantity: 5, 'max-retries': 5 }),
      },
    ].forEach(({ description, fixtureName, expectedWorkersConfig }) => {
      it(`returns the configured WorkersConfig when the ${description}`, () => {
        expect(parseFixture(fixtureName).workersConfig).toEqual(expectedWorkersConfig);
      });
    });

    [
      {
        description: 'config object does not contain a clients key',
        fixtureName: 'missing_clients_sample_config.yml',
        errorClass: MissingClientsConfig,
        message: 'Invalid config file: expected a top-level "clients" key.',
      },
      {
        description: 'config object does not contain a resources key',
        fixtureName: 'missing_resources_sample_config.yml',
        errorClass: MissingResourceConfig,
        message: 'Invalid config file: expected a top-level "resources" key.',
      },
    ].forEach(({ description, fixtureName, errorClass, message }) => {
      it(`throws an error when the ${description}`, () => {
        expect(() => parseFixture(fixtureName)).toThrowError(errorClass, message);
      });
    });

    it('throws an error for missing resources when the config object is null', () => {
      expect(() => ConfigParser.fromObject(null)).toThrowError(
        'Invalid config file: expected a top-level "resources" key.',
      );
    });

    describe('when the config has web configuration', () => {
      it('returns a WebConfig instance', () => {
        expect(parseFixture('sample_config_with_web.yml').webConfig).toBeInstanceOf(WebConfig);
      });

      it('returns the configured web port', () => {
        expect(parseFixture('sample_config_with_web.yml').webConfig.port).toBe(3000);
      });
    });

    it('returns null for webConfig when the config has no web key', () => {
      expect(parseFixture('sample_config.yml').webConfig).toBeNull();
    });

    describe('when client config includes headers', () => {
      it('returns clients with parsed headers', () => {
        expect(parseFixture('sample_config_with_headers.yml').clients.auth_api.headers).toEqual({
          Authorization: 'Bearer my-token',
          'X-Custom-Header': 'custom-value',
        });
      });

      it('returns a client without headers as empty object', () => {
        expect(parseFixture('sample_config_with_headers.yml').clients.default.headers).toEqual({});
      });
    });

    describe('when the config has a log key', () => {
      it('returns a LogConfig instance', () => {
        expect(parseFixture('sample_config_with_log.yml').logConfig).toBeInstanceOf(LogConfig);
      });

      it('returns the configured log size', () => {
        expect(parseFixture('sample_config_with_log.yml').logConfig.size).toBe(50);
      });
    });

    it('returns the default LogConfig size when the config has no log key', () => {
      expect(parseFixture('sample_config.yml').logConfig.size).toBe(100);
    });

    describe('when the config has a failure key', () => {
      it('returns a FailureConfig instance', () => {
        expect(parseFixture('sample_config_with_failure.yml').failureConfig).toBeInstanceOf(FailureConfig);
      });

      it('returns the configured failure threshold', () => {
        expect(parseFixture('sample_config_with_failure.yml').failureConfig.threshold).toBe(10.0);
      });
    });

    it('returns null for failureConfig when the config has no failure key', () => {
      expect(parseFixture('sample_config.yml').failureConfig).toBeNull();
    });
  });
});
