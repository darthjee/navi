/* eslint-disable no-console */
import { Logger } from '../../lib/utils/Logger.js';

describe('Logger', () => {
  beforeEach(() => {
    spyOn(console, 'debug').and.stub();
    spyOn(console, 'info').and.stub();
    spyOn(console, 'warn').and.stub();
    spyOn(console, 'error').and.stub();
  });

  describe('default level (info)', () => {
    let logger;

    beforeEach(() => {
      logger = new Logger();
    });

    it('does not log debug messages', () => {
      logger.debug('msg');
      expect(console.debug).not.toHaveBeenCalled();
    });

    it('logs info messages', () => {
      logger.info('msg');
      expect(console.info).toHaveBeenCalledWith('msg');
    });

    it('logs warn messages', () => {
      logger.warn('msg');
      expect(console.warn).toHaveBeenCalledWith('msg');
    });

    it('logs error messages', () => {
      logger.error('msg');
      expect(console.error).toHaveBeenCalledWith('msg');
    });
  });

  describe('with level debug', () => {
    let logger;

    beforeEach(() => {
      logger = new Logger('debug');
    });

    it('logs debug messages', () => {
      logger.debug('msg');
      expect(console.debug).toHaveBeenCalledWith('msg');
    });

    it('logs info messages', () => {
      logger.info('msg');
      expect(console.info).toHaveBeenCalledWith('msg');
    });

    it('logs warn messages', () => {
      logger.warn('msg');
      expect(console.warn).toHaveBeenCalledWith('msg');
    });

    it('logs error messages', () => {
      logger.error('msg');
      expect(console.error).toHaveBeenCalledWith('msg');
    });
  });

  describe('with level warn', () => {
    let logger;

    beforeEach(() => {
      logger = new Logger('warn');
    });

    it('does not log debug messages', () => {
      logger.debug('msg');
      expect(console.debug).not.toHaveBeenCalled();
    });

    it('does not log info messages', () => {
      logger.info('msg');
      expect(console.info).not.toHaveBeenCalled();
    });

    it('logs warn messages', () => {
      logger.warn('msg');
      expect(console.warn).toHaveBeenCalledWith('msg');
    });

    it('logs error messages', () => {
      logger.error('msg');
      expect(console.error).toHaveBeenCalledWith('msg');
    });
  });

  describe('with level error', () => {
    let logger;

    beforeEach(() => {
      logger = new Logger('error');
    });

    it('does not log debug messages', () => {
      logger.debug('msg');
      expect(console.debug).not.toHaveBeenCalled();
    });

    it('does not log info messages', () => {
      logger.info('msg');
      expect(console.info).not.toHaveBeenCalled();
    });

    it('does not log warn messages', () => {
      logger.warn('msg');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('logs error messages', () => {
      logger.error('msg');
      expect(console.error).toHaveBeenCalledWith('msg');
    });
  });

  describe('with level silent', () => {
    let logger;

    beforeEach(() => {
      logger = new Logger('silent');
    });

    it('does not log debug messages', () => {
      logger.debug('msg');
      expect(console.debug).not.toHaveBeenCalled();
    });

    it('does not log info messages', () => {
      logger.info('msg');
      expect(console.info).not.toHaveBeenCalled();
    });

    it('does not log warn messages', () => {
      logger.warn('msg');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('does not log error messages', () => {
      logger.error('msg');
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('with LOG_LEVEL env var', () => {
    let logger;
    let originalLevel;

    beforeEach(() => {
      originalLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'warn';
      logger = new Logger();
    });

    afterEach(() => {
      if (originalLevel === undefined) {
        delete process.env.LOG_LEVEL;
      } else {
        process.env.LOG_LEVEL = originalLevel;
      }
    });

    it('uses LOG_LEVEL from environment', () => {
      logger.info('msg');
      expect(console.info).not.toHaveBeenCalled();
      logger.warn('msg');
      expect(console.warn).toHaveBeenCalledWith('msg');
    });
  });

  describe('.default', () => {
    it('returns a Logger instance', () => {
      expect(Logger.default()).toBeInstanceOf(Logger);
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

  describe('#suppress', () => {
    let logger;

    beforeEach(() => {
      logger = new Logger('debug');
    });

    describe('when called with no argument (default true)', () => {
      beforeEach(() => {
        logger.suppress();
      });

      it('suppresses info messages', () => {
        logger.info('msg');
        expect(console.info).not.toHaveBeenCalled();
      });

      it('suppresses error messages', () => {
        logger.error('msg');
        expect(console.error).not.toHaveBeenCalled();
      });
    });

    describe('when called with false after suppressing', () => {
      beforeEach(() => {
        logger.suppress(true);
        logger.suppress(false);
      });

      it('restores log output', () => {
        logger.info('msg');
        expect(console.info).toHaveBeenCalledWith('msg');
      });
    });
  });

  describe('.suppress', () => {
    it('delegates to the default logger instance', () => {
      spyOn(Logger.default(), 'suppress');
      Logger.suppress(true);
      expect(Logger.default().suppress).toHaveBeenCalledWith(true);
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

    it('causes default() to return a new Logger instance', () => {
      const newInstance = Logger.default();
      expect(newInstance).toBeInstanceOf(Logger);
      expect(newInstance).not.toBe(instanceBeforeReset);
    });
  });

  describe('.setDefault', () => {
    let originalInstance;
    let customLogger;

    beforeEach(() => {
      originalInstance = Logger.default();
      customLogger = new Logger('debug');
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
