/* eslint-disable no-console */
import { ConsoleLogger } from '../../lib/utils/ConsoleLogger.js';
import { Logger } from '../../lib/utils/Logger.js';
import { LoggerGroup } from '../../lib/utils/LoggerGroup.js';

describe('Logger', () => {
  beforeEach(() => {
    spyOn(console, 'debug').and.stub();
    spyOn(console, 'info').and.stub();
    spyOn(console, 'warn').and.stub();
    spyOn(console, 'error').and.stub();
  });

  describe('.default', () => {
    it('returns a LoggerGroup instance', () => {
      expect(Logger.default()).toBeInstanceOf(LoggerGroup);
    });

    it('returns the same instance on successive calls (singleton)', () => {
      expect(Logger.default()).toBe(Logger.default());
    });
  });

  describe('.debug', () => {
    it('delegates to the default logger instance', () => {
      spyOn(Logger.default(), 'debug');
      Logger.debug('static debug msg');
      expect(Logger.default().debug).toHaveBeenCalledWith('static debug msg');
    });
  });

  describe('.info', () => {
    it('delegates to the default logger instance', () => {
      spyOn(Logger.default(), 'info');
      Logger.info('static info msg');
      expect(Logger.default().info).toHaveBeenCalledWith('static info msg');
    });
  });

  describe('.warn', () => {
    it('delegates to the default logger instance', () => {
      spyOn(Logger.default(), 'warn');
      Logger.warn('static warn msg');
      expect(Logger.default().warn).toHaveBeenCalledWith('static warn msg');
    });
  });

  describe('.error', () => {
    it('delegates to the default logger instance', () => {
      spyOn(Logger.default(), 'error');
      Logger.error('static error msg');
      expect(Logger.default().error).toHaveBeenCalledWith('static error msg');
    });
  });

  describe('.suppress', () => {
    it('delegates to the default logger instance', () => {
      spyOn(Logger.default(), 'suppress');
      Logger.suppress(true);
      expect(Logger.default().suppress).toHaveBeenCalledWith(true);
    });
  });

  describe('.setLevel', () => {
    it('delegates to the default logger instance', () => {
      spyOn(Logger.default(), 'setLevel');
      Logger.setLevel('debug');
      expect(Logger.default().setLevel).toHaveBeenCalledWith('debug');
    });
  });

  describe('.reset', () => {
    let instanceBeforeReset;

    beforeEach(() => {
      instanceBeforeReset = Logger.default();
      Logger.reset();
    });

    afterEach(() => {
      Logger.reset();
    });

    it('causes default() to return a new LoggerGroup instance', () => {
      const newInstance = Logger.default();
      expect(newInstance).toBeInstanceOf(LoggerGroup);
      expect(newInstance).not.toBe(instanceBeforeReset);
    });
  });

  describe('.setDefault', () => {
    let originalInstance;
    let customLogger;

    beforeEach(() => {
      originalInstance = Logger.default();
      customLogger = new ConsoleLogger();
      Logger.setDefault(customLogger);
    });

    afterEach(() => {
      Logger.reset();
    });

    it('sets a new LoggerGroup as the default', () => {
      expect(Logger.default()).toBeInstanceOf(LoggerGroup);
    });

    it('new LoggerGroup contains the provided logger', () => {
      expect(Logger.default().getLoggers()).toContain(customLogger);
    });
  });

  describe('.setLogger', () => {
    let originalInstance;
    let customLogger;

    beforeEach(() => {
      originalInstance = Logger.default();
      customLogger = {
        debug: jasmine.createSpy('debug'),
        info: jasmine.createSpy('info'),
        warn: jasmine.createSpy('warn'),
        error: jasmine.createSpy('error'),
        suppress: jasmine.createSpy('suppress'),
        setLevel: jasmine.createSpy('setLevel'),
      };
      Logger.setLogger(customLogger);
    });

    afterEach(() => {
      Logger.reset();
    });

    it('replaces the default instance with a new LoggerGroup', () => {
      expect(Logger.default()).toBeInstanceOf(LoggerGroup);
      expect(Logger.default()).not.toBe(originalInstance);
    });

    it('new LoggerGroup contains the provided logger', () => {
      expect(Logger.default().getLoggers()).toContain(customLogger);
    });
  });

  describe('.addLogger', () => {
    let originalInstance;
    let extraLogger;

    beforeEach(() => {
      originalInstance = Logger.default();
      extraLogger = {
        debug: jasmine.createSpy('debug'),
        info: jasmine.createSpy('info'),
        warn: jasmine.createSpy('warn'),
        error: jasmine.createSpy('error'),
      };
      Logger.addLogger(extraLogger);
    });

    afterEach(() => {
      Logger.reset();
    });

    it('delegates to the default LoggerGroup addLogger', () => {
      expect(Logger.default().getLoggers()).toContain(extraLogger);
    });
  });
});

