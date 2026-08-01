import { ConfigurationFileNotFound } from '../../../lib/exceptions/config/ConfigurationFileNotFound.js';
import { DuplicateNamespaceItem } from '../../../lib/exceptions/registry/DuplicateNamespaceItem.js';
import { NamespaceNotFound } from '../../../lib/exceptions/registry/NamespaceNotFound.js';
import { WorkersConfig } from '../../../lib/models/configs/WorkersConfig.js';
import { ConfigLoader } from '../../../lib/services/ConfigLoader.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { FixturesUtils } from '../../support/utils/FixturesUtils.js';

describe('ConfigLoader', () => {
  let expectedWorkersConfig;

  describe('.fromFile', () => {
    describe('when the yaml file is valid', () => {
      let config;

      beforeEach(() => {
        expectedWorkersConfig = new WorkersConfig({ quantity: 5 });

        const configFilePath = FixturesUtils.getFixturePath('config/sample_config.yml');
        config = ConfigLoader.fromFile(configFilePath);
      });

      it('returns a namespaceMap with the default namespace resources', () => {
        expect(config.namespaceMap.default.resourceRegistry.getItem('categories')).toBeDefined();
      });

      it('returns a namespaceMap with the default namespace clients', () => {
        expect(config.namespaceMap.default.clientRegistry.getClient('default').baseUrl).toBe('https://example.com');
      });

      it('returns workers configuration', () => {
        expect(config.workersConfig).toEqual(expectedWorkersConfig);
      });
    });

    describe('when the yaml misses workers definition', () => {
      let config;

      beforeEach(() => {
        expectedWorkersConfig = new WorkersConfig({ quantity: 1 });

        const configFilePath = FixturesUtils.getFixturePath('config/missing_workers_config.yml');
        config = ConfigLoader.fromFile(configFilePath);
      });

      it('returns mapped resources by name', () => {
        expect(config.namespaceMap.default.resourceRegistry.getItem('categories')).toBeDefined();
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

    describe('when the yaml contains env var references', () => {
      let config;

      beforeEach(() => {
        process.env.NAVI_TEST_BASE_URL = 'https://resolved.example.com';
        process.env.NAVI_TEST_TOKEN = 'resolved-token';

        const configFilePath = FixturesUtils.getFixturePath('config/sample_config_with_env_vars.yml');
        config = ConfigLoader.fromFile(configFilePath);
      });

      afterEach(() => {
        delete process.env.NAVI_TEST_BASE_URL;
        delete process.env.NAVI_TEST_TOKEN;
      });

      it('resolves env vars in base_url', () => {
        expect(config.namespaceMap.default.clientRegistry.getClient('default').baseUrl).toEqual('https://resolved.example.com');
      });

      it('resolves env vars in headers', () => {
        expect(config.namespaceMap.default.clientRegistry.getClient('default').headers).toEqual({
          Authorization: 'Bearer resolved-token',
        });
      });
    });

    describe('when the config is split across multiple included files', () => {
      it('groups resources/clients by namespace across the whole include chain', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/split_config/config.yml');

        const config = ConfigLoader.fromFile(configFilePath);

        expect(config.namespaceMap.default.resourceRegistry.getItem('people')).toBeDefined();
        expect(config.namespaceMap.paginated.resourceRegistry.getItem('paginated_people')).toBeDefined();
        expect(config.namespaceMap.clients.clientRegistry.getClient('non-default')).toBeDefined();
      });
    });

    describe('when two included files declare the same resource name in the same namespace', () => {
      it('throws DuplicateNamespaceItem', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/duplicate_namespace/config.yml');

        expect(() => ConfigLoader.fromFile(configFilePath)).toThrowError(DuplicateNamespaceItem);
      });
    });

    describe('when an action references a namespace that does not exist', () => {
      it('throws NamespaceNotFound eagerly at load time', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/unresolvable_namespace/config.yml');

        expect(() => ConfigLoader.fromFile(configFilePath)).toThrowError(NamespaceNotFound);
      });
    });
  });
});
