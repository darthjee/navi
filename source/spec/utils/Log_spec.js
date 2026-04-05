import { Log } from '../../lib/utils/Log.js';

describe('Log', () => {
  let log;

  beforeEach(() => {
    log = new Log(1, 'info', 'test message');
  });

  describe('constructor', () => {
    it('creates a log with the given id', () => {
      expect(log.id).toBe(1);
    });

    it('creates a log with the given level', () => {
      expect(log.level).toBe('info');
    });

    it('creates a log with the given message', () => {
      expect(log.message).toBe('test message');
    });

    it('creates a log with a timestamp', () => {
      expect(log.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('#id', () => {
    it('returns the log id', () => {
      const anotherLog = new Log(42, 'debug', 'msg');
      expect(anotherLog.id).toBe(42);
    });
  });

  describe('#level', () => {
    it('returns the log level', () => {
      const anotherLog = new Log(1, 'error', 'msg');
      expect(anotherLog.level).toBe('error');
    });
  });

  describe('#message', () => {
    it('returns the log message', () => {
      const anotherLog = new Log(1, 'info', 'specific message');
      expect(anotherLog.message).toBe('specific message');
    });
  });

  describe('#timestamp', () => {
    it('returns a Date created at construction time', () => {
      const before = new Date();
      const anotherLog = new Log(1, 'info', 'msg');
      const after = new Date();

      expect(anotherLog.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(anotherLog.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('#toJSON', () => {
    it('returns an object with the log id', () => {
      expect(log.toJSON().id).toBe(1);
    });

    it('returns an object with the log level', () => {
      expect(log.toJSON().level).toBe('info');
    });

    it('returns an object with the log message', () => {
      expect(log.toJSON().message).toBe('test message');
    });

    it('returns an object with the timestamp as ISO string', () => {
      expect(log.toJSON().timestamp).toBe(log.timestamp.toISOString());
    });
  });
});
