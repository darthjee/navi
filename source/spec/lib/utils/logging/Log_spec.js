import { Log } from '../../../../lib/utils/logging/Log.js';

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

    it('creates a log with empty attributes by default', () => {
      expect(log.attributes).toEqual({});
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

  describe('#attributes', () => {
    it('returns empty object when no attributes are provided', () => {
      const anotherLog = new Log(1, 'info', 'msg');
      expect(anotherLog.attributes).toEqual({});
    });

    it('returns the provided attributes', () => {
      const attrs = { jobId: 42, resource: 'home' };
      const anotherLog = new Log(1, 'info', 'msg', attrs);
      expect(anotherLog.attributes).toEqual(attrs);
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

    it('returns an object with the attributes', () => {
      expect(log.toJSON().attributes).toEqual({});
    });

    it('returns an object with attributes when provided', () => {
      const attrs = { jobId: 1 };
      const logWithAttrs = new Log(1, 'info', 'msg', attrs);
      expect(logWithAttrs.toJSON().attributes).toEqual(attrs);
    });

    it('returns an object with the timestamp as ISO string', () => {
      expect(log.toJSON().timestamp).toBe(log.timestamp.toISOString());
    });
  });
});
