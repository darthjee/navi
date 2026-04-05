import { BaseLogger } from '../../lib/utils/BaseLogger.js';

describe('BaseLogger', () => {
  let logger;

  beforeEach(() => {
    logger = new BaseLogger('info');
    spyOn(logger, '_output');
  });

  describe('default level (info)', () => {
    it('does not output debug messages', () => {
      logger.debug('msg');
      expect(logger._output).not.toHaveBeenCalled();
    });

    it('outputs info messages', () => {
      logger.info('msg');
      expect(logger._output).toHaveBeenCalledWith('info', 'msg');
    });

    it('outputs warn messages', () => {
      logger.warn('msg');
      expect(logger._output).toHaveBeenCalledWith('warn', 'msg');
    });

    it('outputs error messages', () => {
      logger.error('msg');
      expect(logger._output).toHaveBeenCalledWith('error', 'msg');
    });
  });

  describe('with level debug', () => {
    beforeEach(() => {
      logger = new BaseLogger('debug');
      spyOn(logger, '_output');
    });

    it('outputs debug messages', () => {
      logger.debug('msg');
      expect(logger._output).toHaveBeenCalledWith('debug', 'msg');
    });

    it('outputs info messages', () => {
      logger.info('msg');
      expect(logger._output).toHaveBeenCalledWith('info', 'msg');
    });

    it('outputs warn messages', () => {
      logger.warn('msg');
      expect(logger._output).toHaveBeenCalledWith('warn', 'msg');
    });

    it('outputs error messages', () => {
      logger.error('msg');
      expect(logger._output).toHaveBeenCalledWith('error', 'msg');
    });
  });

  describe('with level warn', () => {
    beforeEach(() => {
      logger = new BaseLogger('warn');
      spyOn(logger, '_output');
    });

    it('does not output debug messages', () => {
      logger.debug('msg');
      expect(logger._output).not.toHaveBeenCalled();
    });

    it('does not output info messages', () => {
      logger.info('msg');
      expect(logger._output).not.toHaveBeenCalled();
    });

    it('outputs warn messages', () => {
      logger.warn('msg');
      expect(logger._output).toHaveBeenCalledWith('warn', 'msg');
    });

    it('outputs error messages', () => {
      logger.error('msg');
      expect(logger._output).toHaveBeenCalledWith('error', 'msg');
    });
  });

  describe('with level error', () => {
    beforeEach(() => {
      logger = new BaseLogger('error');
      spyOn(logger, '_output');
    });

    it('does not output debug messages', () => {
      logger.debug('msg');
      expect(logger._output).not.toHaveBeenCalled();
    });

    it('does not output info messages', () => {
      logger.info('msg');
      expect(logger._output).not.toHaveBeenCalled();
    });

    it('does not output warn messages', () => {
      logger.warn('msg');
      expect(logger._output).not.toHaveBeenCalled();
    });

    it('outputs error messages', () => {
      logger.error('msg');
      expect(logger._output).toHaveBeenCalledWith('error', 'msg');
    });
  });

  describe('with level silent', () => {
    beforeEach(() => {
      logger = new BaseLogger('silent');
      spyOn(logger, '_output');
    });

    it('does not output debug messages', () => {
      logger.debug('msg');
      expect(logger._output).not.toHaveBeenCalled();
    });

    it('does not output info messages', () => {
      logger.info('msg');
      expect(logger._output).not.toHaveBeenCalled();
    });

    it('does not output warn messages', () => {
      logger.warn('msg');
      expect(logger._output).not.toHaveBeenCalled();
    });

    it('does not output error messages', () => {
      logger.error('msg');
      expect(logger._output).not.toHaveBeenCalled();
    });
  });

  describe('with LOG_LEVEL env var', () => {
    let originalLevel;

    beforeEach(() => {
      originalLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'warn';
      logger = new BaseLogger();
      spyOn(logger, '_output');
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
      expect(logger._output).not.toHaveBeenCalled();
      logger.warn('msg');
      expect(logger._output).toHaveBeenCalledWith('warn', 'msg');
    });
  });

  describe('#suppress', () => {
    describe('when called with no argument (default true)', () => {
      beforeEach(() => {
        logger.suppress();
      });

      it('suppresses info messages', () => {
        logger.info('msg');
        expect(logger._output).not.toHaveBeenCalled();
      });

      it('suppresses error messages', () => {
        logger.error('msg');
        expect(logger._output).not.toHaveBeenCalled();
      });
    });

    describe('when called with false after suppressing', () => {
      beforeEach(() => {
        logger.suppress(true);
        logger.suppress(false);
      });

      it('restores output', () => {
        logger.info('msg');
        expect(logger._output).toHaveBeenCalledWith('info', 'msg');
      });
    });
  });

  describe('#setLevel', () => {
    it('lowers the level to allow previously-suppressed messages', () => {
      logger.setLevel('debug');
      logger.debug('msg');
      expect(logger._output).toHaveBeenCalledWith('debug', 'msg');
    });

    it('raises the level to suppress previously-logged messages', () => {
      logger.setLevel('warn');
      logger.info('msg');
      expect(logger._output).not.toHaveBeenCalled();
    });

    it('throws for an invalid level', () => {
      expect(() => logger.setLevel('verbose')).toThrowError(/Invalid log level/);
    });
  });
});
