/* eslint-disable no-console */
import { ConsoleLogger } from '../../lib/utils/ConsoleLogger.js';
import { Logger } from '../../lib/utils/Logger.js';

describe('Logger', () => {
  beforeEach(() => {
    spyOn(console, 'debug').and.stub();
    spyOn(console, 'info').and.stub();
    spyOn(console, 'warn').and.stub();
    spyOn(console, 'error').and.stub();
  });

  describe('.default', () => {
    it('returns a ConsoleLogger instance', () => {
      expect(Logger.default()).toBeInstanceOf(ConsoleLogger);
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
      Logger.setDefault(instanceBeforeReset);
    });

    it('causes default() to return a new ConsoleLogger instance', () => {
      const newInstance = Logger.default();
      expect(newInstance).toBeInstanceOf(ConsoleLogger);
      expect(newInstance).not.toBe(instanceBeforeReset);
    });
  });

  describe('.setDefault', () => {
    let originalInstance;
    let customLogger;

    beforeEach(() => {
      originalInstance = Logger.default();
      customLogger = new ConsoleLogger('debug');
      Logger.setDefault(customLogger);
    });

    afterEach(() => {
      Logger.setDefault(originalInstance);
    });

    it('sets the instance returned by default()', () => {
      expect(Logger.default()).toBe(customLogger);
    });
  });
});

