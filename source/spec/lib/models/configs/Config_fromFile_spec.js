import { NamespaceNotFound } from '../../../../lib/exceptions/registry/NamespaceNotFound.js';
import { Config } from '../../../../lib/models/configs/Config.js';
import { EmitConfig } from '../../../../lib/models/configs/EmitConfig.js';
import { ExtractionConfig } from '../../../../lib/models/configs/ExtractionConfig.js';
import { FailureConfig } from '../../../../lib/models/configs/FailureConfig.js';
import { LogConfig } from '../../../../lib/models/configs/LogConfig.js';
import { WorkersConfig } from '../../../../lib/models/configs/WorkersConfig.js';
import { NamespaceMap } from '../../../../lib/registry/NamespaceMap.js';
import { ResourceRegistry } from '../../../../lib/registry/ResourceRegistry.js';
import { ResourceFactory } from '../../../support/factories/ResourceFactory.js';
import { FixturesUtils } from '../../../support/utils/FixturesUtils.js';

describe('Config', () => {
  let expectedResources;
  let expectedResourceRegistry;
  let expectedWorkersConfig;

  afterEach(() => {
    NamespaceMap.reset();
  });

  describe('.fromFile', () => {
    describe('when the yaml file is valid', () => {
      beforeEach(() => {
        expectedResources = {
          categories: ResourceFactory.build(),
        };
        expectedResourceRegistry = new ResourceRegistry(expectedResources);
        expectedWorkersConfig = new WorkersConfig({ quantity: 5 });
      });

      it('returns a Config instance with resources from yaml file', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/sample_config.yml');

        const config = Config.fromFile(configFilePath);

        expect(config instanceof Config).toBeTrue();
        expect(config.resourceRegistry).toEqual(expectedResourceRegistry);
        expect(config.clientRegistry).toBeUndefined();
        expect(config.workersConfig).toEqual(expectedWorkersConfig);
        expect(config.logConfig instanceof LogConfig).toBeTrue();
        expect(config.logConfig.size).toBe(100);
        expect(config.emitConfig instanceof EmitConfig).toBeTrue();
        expect(config.emitConfig.size).toBe(100);
        expect(config.extractionConfig instanceof ExtractionConfig).toBeTrue();
        expect(config.extractionConfig.size).toBe(100);
      });
    });

    describe('when the yaml file has a log section', () => {
      it('returns a Config with the configured log size', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/sample_config_with_log.yml');

        const config = Config.fromFile(configFilePath);

        expect(config.logConfig.size).toBe(50);
      });
    });

    describe('when the yaml file has an emit section', () => {
      it('returns a Config with the configured emit size', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/sample_config_with_emit.yml');

        const config = Config.fromFile(configFilePath);

        expect(config.emitConfig.size).toBe(25);
      });
    });

    describe('when the yaml file has an extraction section', () => {
      it('returns a Config with the configured extraction size', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/sample_config_with_extraction.yml');

        const config = Config.fromFile(configFilePath);

        expect(config.extractionConfig.size).toBe(25);
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

    describe('when the yaml file has a failure section', () => {
      it('returns a Config with a FailureConfig instance', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/sample_config_with_failure.yml');

        const config = Config.fromFile(configFilePath);

        expect(config.failureConfig instanceof FailureConfig).toBeTrue();
        expect(config.failureConfig.threshold).toBe(10.0);
      });
    });

    describe('when the yaml file has no failure section', () => {
      it('returns a Config with null failureConfig', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/sample_config.yml');

        const config = Config.fromFile(configFilePath);

        expect(config.failureConfig).toBeNull();
      });
    });

    describe('when the config is split across multiple included files', () => {
      let config;

      beforeEach(() => {
        const configFilePath = FixturesUtils.getFixturePath('config/split_config/config.yml');
        config = Config.fromFile(configFilePath);
      });

      it('merges resources declared in the entry file (default namespace)', () => {
        expect(config.getResource('people')).toBeDefined();
        expect(config.getResource('person')).toBeDefined();
      });

      it('exposes resources declared in a namespaced included file', () => {
        expect(config.namespaceMap.getResource('default', 'paginated_people', 'paginated')).toBeDefined();
      });

      it('exposes clients declared in a namespaced included file', () => {
        const client = config.namespaceMap.getClient('default', 'non-default', 'clients');
        expect(client.baseUrl).toBe('https://example.com');
      });

      it('resolves a cross-namespace action target eagerly validated at load time', () => {
        const paginatedPeople = config.namespaceMap.getResource('default', 'paginated_people', 'paginated');
        const [request] = paginatedPeople.resourceRequests;
        expect(request.actions[0].resource).toBe('person');
      });
    });

    describe('when two included files declare the same resource name in the same namespace', () => {
      it('replaces on collision, the later included file winning', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/duplicate_namespace/config.yml');

        const config = Config.fromFile(configFilePath);

        const [request] = config.getResource('categories').resourceRequests;
        expect(request.url).toBe('/other-categories.json');
      });
    });

    describe('when an action references a namespace that does not exist', () => {
      it('throws NamespaceNotFound eagerly at load time', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/unresolvable_namespace/config.yml');

        expect(() => Config.fromFile(configFilePath)).toThrowError(NamespaceNotFound);
      });
    });
  });
});
