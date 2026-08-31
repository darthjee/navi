import { ConsoleLogger } from '../../../lib/logging/ConsoleLogger.js';
import { Logger } from '../../../lib/logging/Logger.js';

describe('Logger', () => {
  afterEach(() => {
    Logger.reset();
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
      expect(Logger.default().debug).toHaveBeenCalledWith('static debug msg', {});
    });

    it('forwards attributes to the default logger instance', () => {
      const attrs = { path: '/tmp/config.yml' };
      spyOn(Logger.default(), 'debug');
      Logger.debug('msg', attrs);
      expect(Logger.default().debug).toHaveBeenCalledWith('msg', attrs);
    });
  });

  describe('.info', () => {
    it('delegates to the default logger instance', () => {
      spyOn(Logger.default(), 'info');
      Logger.info('static info msg');
      expect(Logger.default().info).toHaveBeenCalledWith('static info msg', {});
    });

    it('forwards attributes to the default logger instance', () => {
      const attrs = { action: 'config' };
      spyOn(Logger.default(), 'info');
      Logger.info('msg', attrs);
      expect(Logger.default().info).toHaveBeenCalledWith('msg', attrs);
    });
  });

  describe('.warn', () => {
    it('delegates to the default logger instance', () => {
      spyOn(Logger.default(), 'warn');
      Logger.warn('static warn msg');
      expect(Logger.default().warn).toHaveBeenCalledWith('static warn msg', {});
    });

    it('forwards attributes to the default logger instance', () => {
      const attrs = { varName: 'API_TOKEN' };
      spyOn(Logger.default(), 'warn');
      Logger.warn('msg', attrs);
      expect(Logger.default().warn).toHaveBeenCalledWith('msg', attrs);
    });
  });

  describe('.error', () => {
    it('delegates to the default logger instance', () => {
      spyOn(Logger.default(), 'error');
      Logger.error('static error msg');
      expect(Logger.default().error).toHaveBeenCalledWith('static error msg', {});
    });

    it('forwards attributes to the default logger instance', () => {
      const attrs = { status: 500 };
      spyOn(Logger.default(), 'error');
      Logger.error('msg', attrs);
      expect(Logger.default().error).toHaveBeenCalledWith('msg', attrs);
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

    it('causes default() to return a new ConsoleLogger instance', () => {
      const newInstance = Logger.default();
      expect(newInstance).toBeInstanceOf(ConsoleLogger);
      expect(newInstance).not.toBe(instanceBeforeReset);
    });
  });
});
