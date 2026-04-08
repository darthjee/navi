import { BaseLogger } from '../../lib/utils/BaseLogger.js';

const levelMatrix = [
  ['debug', { debug: true, info: true, warn: true, error: true }],
  ['info', { debug: false, info: true, warn: true, error: true }],
  ['warn', { debug: false, info: false, warn: true, error: true }],
  ['error', { debug: false, info: false, warn: false, error: true }],
  ['silent', { debug: false, info: false, warn: false, error: false }],
];

describe('BaseLogger', () => {
  let logger;

  levelMatrix.forEach(([level, expected]) => {
    describe(`with level ${level}`, () => {
      beforeEach(() => {
        logger = new BaseLogger(level);
        spyOn(logger, '_output');
      });

      ['debug', 'info', 'warn', 'error'].forEach((method) => {
        if (expected[method]) {
          it(`outputs ${method} messages`, () => {
            logger[method]('msg');
            expect(logger._output).toHaveBeenCalledWith(method, 'msg');
          });
        } else {
          it(`does not output ${method} messages`, () => {
            logger[method]('msg');
            expect(logger._output).not.toHaveBeenCalled();
          });
        }
      });
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
    beforeEach(() => {
      logger = new BaseLogger('info');
      spyOn(logger, '_output');
    });

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
    beforeEach(() => {
      logger = new BaseLogger('info');
      spyOn(logger, '_output');
    });

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
