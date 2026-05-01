import { JobFactory } from '../../../lib/background/JobFactory.js';
import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/background/WorkersRegistry.js';
import { ConfigurationFileNotFound } from '../../../lib/exceptions/ConfigurationFileNotFound.js';
import { ConfigurationFileNotProvided } from '../../../lib/exceptions/ConfigurationFileNotProvided.js';
import { Config } from '../../../lib/models/Config.js';
import { ClientRegistry } from '../../../lib/registry/ClientRegistry.js';
import { ResourceRegistry } from '../../../lib/registry/ResourceRegistry.js';
import { WebServer } from '../../../lib/server/WebServer.js';
import { Application } from '../../../lib/services/Application.js';
import { Engine } from '../../../lib/services/Engine.js';
import { IdentifyableCollection } from '../../../lib/utils/collections/IdentifyableCollection.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { DummyJobFactory } from '../../support/dummies/factories/DummyJobFactory.js';
import { DummyWorkerFactory } from '../../support/dummies/factories/DummyWorkerFactory.js';
import { DummyJob } from '../../support/dummies/models/DummyJob.js';
import { FixturesUtils } from '../../support/utils/FixturesUtils.js';

describe('Application', () => {
  let app;
  let configFilePath;

  let jobFactory;
  let workerFactory;

  afterEach(() => {
    Logger.suppress();
    Logger.reset();
    ClientRegistry.reset();
    JobRegistry.reset();
    JobFactory.reset();
    WorkersRegistry.reset();
    ResourceRegistry.reset();
    Application.reset();
  });

  describe('#loadConfig', () => {
    beforeEach(() => {
      configFilePath = FixturesUtils.getFixturePath('config/sample_config.yml');

      app = Application.build();
    });

    describe('when config file is valid', () => {
      it('should initialize config', () => {
        expect(app.config).toBeUndefined();

        app.loadConfig(configFilePath);

        expect(app.config instanceof Config).toBeTrue();
      });

      it('initializes job registry', () => {
        app.loadConfig(configFilePath);

        expect(() => JobRegistry.hasJob()).not.toThrow();
      });

      it('registers the Action factory', () => {
        app.loadConfig(configFilePath);

        expect(JobFactory.get('Action')).toBeDefined();
      });

      it('registers the HtmlParse factory', () => {
        app.loadConfig(configFilePath);

        expect(JobFactory.get('HtmlParse')).toBeDefined();
      });

      it('registers the AssetDownload factory', () => {
        app.loadConfig(configFilePath);

        expect(JobFactory.get('AssetDownload')).toBeDefined();
      });

      it('does not expose a clients property on config (uses clientRegistry instead)', () => {
        app.loadConfig(configFilePath);

        expect(app.config.clients).toBeUndefined();
        expect(app.config.clientRegistry).toBeDefined();
      });

      it('initializes workers registry', () => {
        const workers = new IdentifyableCollection();

        app = Application.build({ workers });

        app.loadConfig(configFilePath);

        expect(workers.size()).toEqual(5);
      });

      it('creates a buffered logger with the default retention size', () => {
        app.loadConfig(configFilePath);

        expect(app.bufferedLogger.retention).toBe(100);
      });
    });

    describe('when config file has a log size', () => {
      beforeEach(() => {
        configFilePath = FixturesUtils.getFixturePath('config/sample_config_with_log.yml');
      });

      it('creates a buffered logger with the configured retention size', () => {
        app.loadConfig(configFilePath);

        expect(app.bufferedLogger.retention).toBe(50);
      });
    });

    describe('when config file is invalid', () => {
      beforeEach(() => {
        spyOn(Logger, 'error').and.stub();
      });

      it('should throw an error', () => {
        expect(() => app.loadConfig('invalid')).toThrowError(ConfigurationFileNotFound);
      });
    });

    describe('when config file is not given', () => {
      it('should throw an error', () => {
        expect(() => app.loadConfig()).toThrowError(ConfigurationFileNotProvided);
      });
    });
  });

  describe('#run', () => {
    beforeEach(() => {
      DummyJob.setSuccessRate(1);

      configFilePath = FixturesUtils.getFixturePath('config/sample_config.yml');

      jobFactory = new DummyJobFactory();
      workerFactory = new DummyWorkerFactory({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry });

      app = Application.build();
      app.loadConfig(configFilePath);
      WorkersRegistry.reset();
      WorkersRegistry.build({ quantity: 1, factory: workerFactory });
      WorkersRegistry.initWorkers();
      JobFactory.registry('ResourceRequestJob', jobFactory);
    });

    it('processes all initial parameter-free jobs', async () => {
      await app.run();
      expect(JobRegistry.hasJob()).toBeFalse();
    });

    it('sets webServer to null when no web config present', async () => {
      await app.run();
      expect(app.webServer).toBeNull();
    });

    describe('when web server is present', () => {
      let webServerStartResolved;
      let resolveWebServerStart;

      beforeEach(() => {
        ClientRegistry.reset();
        JobRegistry.reset();
        JobFactory.reset();
        WorkersRegistry.reset();
        ResourceRegistry.reset();

        configFilePath = FixturesUtils.getFixturePath('config/sample_config_with_web.yml');

        app = Application.build();
        app.loadConfig(configFilePath);
        WorkersRegistry.reset();
        WorkersRegistry.build({ quantity: 1, factory: workerFactory });
        WorkersRegistry.initWorkers();
        JobFactory.registry('ResourceRequestJob', jobFactory);

        webServerStartResolved = false;

        const webServerPromise = new Promise((resolve) => {
          resolveWebServerStart = resolve;
        });

        spyOn(WebServer.prototype, 'start').and.callFake(() => {
          return webServerPromise.then(() => {
            webServerStartResolved = true;
          });
        });

        spyOn(app, 'buildEngine').and.callFake(() => new Engine({ keepAlive: true, sleepMs: 1 }));
      });

      it('waits for web server promise before resolving', async () => {
        let runResolved = false;

        const runPromise = app.run().then(() => {
          runResolved = true;
        });

        // Allow engine to finish processing
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(webServerStartResolved).toBeFalse();
        expect(runResolved).toBeFalse();

        resolveWebServerStart();
        app.engine.stop();
        await runPromise;

        expect(webServerStartResolved).toBeTrue();
        expect(runResolved).toBeTrue();
      });
    });
  });

  describe('#buildWebServer', () => {
    describe('when config has no web key', () => {
      beforeEach(() => {
        configFilePath = FixturesUtils.getFixturePath('config/sample_config.yml');
        app = Application.build();
        app.loadConfig(configFilePath);
      });

      it('returns null', () => {
        expect(app.buildWebServer()).toBeNull();
      });
    });

    describe('when config has a web key', () => {
      beforeEach(() => {
        configFilePath = FixturesUtils.getFixturePath('config/sample_config_with_web.yml');
        app = Application.build();
        app.loadConfig(configFilePath);
      });

      it('returns a WebServer instance', () => {
        expect(app.buildWebServer() instanceof WebServer).toBeTrue();
      });
    });
  });

  [
    { method: 'isRunning', trueStatus: 'running', falseStatus: 'paused' },
    { method: 'isPaused', trueStatus: 'paused', falseStatus: 'running' },
    { method: 'isStopped', trueStatus: 'stopped', falseStatus: 'running' },
  ].forEach(({ method, trueStatus, falseStatus }) => {
    describe(`.${method}`, () => {
      describe(`when status is ${trueStatus}`, () => {
        beforeEach(() => {
          spyOn(Application, 'status').and.returnValue(trueStatus);
        });

        it('returns true', () => {
          expect(Application[method]()).toBeTrue();
        });
      });

      describe(`when status is not ${trueStatus}`, () => {
        beforeEach(() => {
          spyOn(Application, 'status').and.returnValue(falseStatus);
        });

        it('returns false', () => {
          expect(Application[method]()).toBeFalse();
        });
      });
    });
  });
});