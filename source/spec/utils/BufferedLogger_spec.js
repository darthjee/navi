/* eslint-disable no-console */
import { BufferedLogger } from '../../lib/utils/BufferedLogger.js';

describe('BufferedLogger', () => {
  let logger;

  beforeEach(() => {
    spyOn(console, 'debug').and.stub();
    spyOn(console, 'info').and.stub();
    spyOn(console, 'warn').and.stub();
    spyOn(console, 'error').and.stub();

    logger = new BufferedLogger('debug');
  });

  describe('constructor', () => {
    it('starts with an empty buffer', () => {
      expect(logger.bufferSize).toBe(0);
    });

    it('defaults retention to 100', () => {
      expect(logger.retention).toBe(100);
    });

    it('accepts a custom retention', () => {
      const customLogger = new BufferedLogger('debug', 50);
      expect(customLogger.retention).toBe(50);
    });
  });

  describe('#debug', () => {
    it('logs the debug message to console', () => {
      logger.debug('msg');
      expect(console.debug).toHaveBeenCalledWith('msg');
    });

    it('adds a debug log to the buffer', () => {
      logger.debug('msg');
      const logs = logger.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe('debug');
      expect(logs[0].message).toBe('msg');
    });

    describe('when the log level is above debug', () => {
      it('does not add to the buffer', () => {
        const infoLogger = new BufferedLogger('info');
        infoLogger.debug('silent');
        expect(infoLogger.bufferSize).toBe(0);
      });

      it('does not log to console', () => {
        const infoLogger = new BufferedLogger('info');
        infoLogger.debug('silent');
        expect(console.debug).not.toHaveBeenCalled();
      });
    });
  });

  describe('#info', () => {
    it('logs the info message to console', () => {
      logger.info('msg');
      expect(console.info).toHaveBeenCalledWith('msg');
    });

    it('adds an info log to the buffer', () => {
      logger.info('msg');
      const logs = logger.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe('info');
    });

    describe('when the log level is above info', () => {
      it('does not add to the buffer', () => {
        const warnLogger = new BufferedLogger('warn');
        warnLogger.info('silent');
        expect(warnLogger.bufferSize).toBe(0);
      });
    });
  });

  describe('#warn', () => {
    it('logs the warn message to console', () => {
      logger.warn('msg');
      expect(console.warn).toHaveBeenCalledWith('msg');
    });

    it('adds a warn log to the buffer', () => {
      logger.warn('msg');
      const logs = logger.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe('warn');
    });

    describe('when the log level is above warn', () => {
      it('does not add to the buffer', () => {
        const errorLogger = new BufferedLogger('error');
        errorLogger.warn('silent');
        expect(errorLogger.bufferSize).toBe(0);
      });
    });
  });

  describe('#error', () => {
    it('logs the error message to console', () => {
      logger.error('msg');
      expect(console.error).toHaveBeenCalledWith('msg');
    });

    it('adds an error log to the buffer', () => {
      logger.error('msg');
      const logs = logger.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe('error');
    });

    describe('when the log level is silent', () => {
      it('does not add to the buffer', () => {
        const silentLogger = new BufferedLogger('silent');
        silentLogger.error('silent');
        expect(silentLogger.bufferSize).toBe(0);
      });
    });
  });

  describe('#getLogs', () => {
    it('returns all buffered logs', () => {
      logger.info('first');
      logger.warn('second');
      expect(logger.getLogs().length).toBe(2);
    });
  });

  describe('#getLogById', () => {
    it('returns the log with the given ID', () => {
      logger.info('first');
      logger.info('second');
      const logs = logger.getLogs();
      const found = logger.getLogById(logs[0].id);
      expect(found).toBe(logs[0]);
    });

    it('returns undefined when no log has the given ID', () => {
      expect(logger.getLogById(999)).toBeUndefined();
    });
  });

  describe('#getLogsByLevel', () => {
    it('returns only logs matching the given level', () => {
      logger.info('info message');
      logger.error('error message');
      logger.info('another info');
      const infoLogs = logger.getLogsByLevel('info');
      expect(infoLogs.length).toBe(2);
      infoLogs.forEach(log => expect(log.level).toBe('info'));
    });
  });

  describe('#clearLogs', () => {
    it('removes all logs from the buffer', () => {
      logger.info('first');
      logger.info('second');
      logger.clearLogs();
      expect(logger.bufferSize).toBe(0);
    });
  });

  describe('#bufferSize', () => {
    it('returns the number of logs in the buffer', () => {
      logger.info('first');
      logger.info('second');
      expect(logger.bufferSize).toBe(2);
    });
  });

  describe('retention behaviour', () => {
    it('discards the oldest log when retention is exceeded', () => {
      const smallLogger = new BufferedLogger('debug', 2);
      smallLogger.info('first');
      smallLogger.info('second');
      smallLogger.info('third');
      expect(smallLogger.bufferSize).toBe(2);
      const logs = smallLogger.getLogs();
      expect(logs[0].message).toBe('second');
      expect(logs[1].message).toBe('third');
    });
  });

  describe('incremental IDs', () => {
    it('assigns unique incremental IDs across log calls', () => {
      logger.info('first');
      logger.info('second');
      const logs = logger.getLogs();
      expect(logs[0].id).toBe(1);
      expect(logs[1].id).toBe(2);
    });
  });

  describe('#getLogsJSON', () => {
    it('returns an array of plain objects', () => {
      logger.info('message');
      const json = logger.getLogsJSON();
      expect(json.length).toBe(1);
      expect(json[0].level).toBe('info');
      expect(json[0].message).toBe('message');
      expect(typeof json[0].timestamp).toBe('string');
    });
  });
});

