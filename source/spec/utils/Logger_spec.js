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
});
