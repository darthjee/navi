import { JobFactory } from '../../../lib/background/JobFactory.js';
import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/background/WorkersRegistry.js';
import { ConfigurationFileNotFound } from '../../../lib/exceptions/config/ConfigurationFileNotFound.js';
import { ConfigurationFileNotProvided } from '../../../lib/exceptions/config/ConfigurationFileNotProvided.js';
import { Config } from '../../../lib/models/configs/Config.js';
import { Application } from '../../../lib/services/Application.js';
import { IdentifyableCollection } from '../../../lib/utils/collections/IdentifyableCollection.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { DummyJobFactory } from '../../support/dummies/factories/DummyJobFactory.js';
import { DummyWorkerFactory } from '../../support/dummies/factories/DummyWorkerFactory.js';
import { DummyJob } from '../../support/dummies/models/DummyJob.js';
import { FixturesUtils } from '../../support/utils/FixturesUtils.js';
import { RegistryCleanupUtils } from '../../support/utils/RegistryCleanupUtils.js';

describe('Application', () => {
  let app;
  let jobFactory;
  let workerFactory;

  const loadApplication = (fixtureName = 'config/sample_config.yml', options = {}) => {
    app = Application.build(options);
    app.loadConfig(FixturesUtils.getFixturePath(fixtureName));
    return app;
  };

  const prepareRunScenario = (fixtureName = 'config/sample_config.yml') => {
    DummyJob.setSuccessRate(1);
    loadApplication(fixtureName);
    WorkersRegistry.reset();
    WorkersRegistry.build({ quantity: 1, factory: workerFactory });
    WorkersRegistry.initWorkers();
    JobFactory.registry('ResourceRequestJob', jobFactory);
  };

  beforeEach(() => {
    Logger.suppress();
    jobFactory = new DummyJobFactory();
    workerFactory = new DummyWorkerFactory({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry });
  });

  afterEach(() => {
    RegistryCleanupUtils.resetApplicationState();
  });

  describe('#loadConfig', () => {
    beforeEach(() => {
      app = Application.build();
    });

    describe('when the config file is valid', () => {
      beforeEach(() => {
        app.loadConfig(FixturesUtils.getFixturePath('config/sample_config.yml'));
      });

      it('initializes config', () => {
        expect(app.config).toBeInstanceOf(Config);
      });

      it('initializes the job registry', () => {
        expect(() => JobRegistry.hasJob()).not.toThrow();
      });

      ['Action', 'HtmlParse', 'AssetDownload'].forEach((factoryName) => {
        it(`registers the ${factoryName} factory`, () => {
          expect(JobFactory.get(factoryName)).toBeDefined();
        });
      });

      it('uses clientRegistry instead of exposing config.clients', () => {
        expect(app.config.clients).toBeUndefined();
        expect(app.config.clientRegistry).toBeDefined();
      });

      it('initializes workers using the configured quantity', () => {
        const workers = new IdentifyableCollection();

        RegistryCleanupUtils.resetApplicationState();
        Logger.suppress();
        loadApplication('config/sample_config.yml', { workers });

        expect(workers.size()).toEqual(5);
      });

      it('creates a buffered logger with the default retention size', () => {
        expect(app.bufferedLogger.retention).toBe(100);
      });
    });

    it('uses the configured log size when present', () => {
      loadApplication('config/sample_config_with_log.yml');

      expect(app.bufferedLogger.retention).toBe(50);
    });

    it('throws ConfigurationFileNotFound when config file is invalid', () => {
      spyOn(Logger, 'error').and.stub();

      expect(() => app.loadConfig('invalid')).toThrowError(ConfigurationFileNotFound);
    });

    it('throws ConfigurationFileNotProvided when config file is omitted', () => {
      expect(() => app.loadConfig()).toThrowError(ConfigurationFileNotProvided);
    });
  });

  describe('#run', () => {
    beforeEach(() => {
      prepareRunScenario();
    });

    it('processes all initial parameter-free jobs', async () => {
      await app.run();

      expect(JobRegistry.hasJob()).toBeFalse();
    });

    it('sets webServer to null when no web config is present', async () => {
      await app.run();

      expect(app.webServer).toBeNull();
    });
  });

  describe('#buildWebServer', () => {
    it('returns null when config has no web key', () => {
      loadApplication('config/sample_config.yml');

      expect(app.buildWebServer()).toBeNull();
    });

    it('returns a web server instance when config has a web key', () => {
      loadApplication('config/sample_config_with_web.yml');

      expect(app.buildWebServer()).not.toBeNull();
    });
  });

  [
    { method: 'isRunning', trueStatus: 'running', falseStatus: 'paused' },
    { method: 'isPaused', trueStatus: 'paused', falseStatus: 'running' },
    { method: 'isStopped', trueStatus: 'stopped', falseStatus: 'running' },
  ].forEach(({ method, trueStatus, falseStatus }) => {
    describe(`.${method}`, () => {
      it(`returns true when status is ${trueStatus}`, () => {
        spyOn(Application, 'status').and.returnValue(trueStatus);

        expect(Application[method]()).toBeTrue();
      });

      it(`returns false when status is ${falseStatus}`, () => {
        spyOn(Application, 'status').and.returnValue(falseStatus);

        expect(Application[method]()).toBeFalse();
      });
    });
  });
});
