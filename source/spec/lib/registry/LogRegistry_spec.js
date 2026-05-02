import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';

describe('LogRegistry', () => {
  beforeEach(() => {
    Logger.suppress();
  });

  afterEach(() => {
    LogRegistry.reset();
    Logger.reset();
  });

  describe('.build', () => {
    it('returns a LogRegistryInstance', () => {
      const instance = LogRegistry.build();
      expect(instance).toBeDefined();
    });

    it('throws if called twice without reset', () => {
      LogRegistry.build();
      expect(() => LogRegistry.build()).toThrowError(/already been called/);
    });

    it('does not wire the BufferedLogger into Logger', () => {
      LogRegistry.build();
      Logger.info('console only');
      expect(LogRegistry.getLogs()).toEqual([]);
    });
  });

  describe('.reset', () => {
    it('allows build to be called again', () => {
      LogRegistry.build();
      LogRegistry.reset();
      expect(() => LogRegistry.build()).not.toThrow();
    });
  });

  describe('.debug', () => {
    it('adds a debug log to the buffer', () => {
      LogRegistry.build({ level: 'debug' });
      LogRegistry.debug('dbg msg');
      const logs = LogRegistry.getLogsByLevel('debug');
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('dbg msg');
    });
  });

  describe('.info', () => {
    it('adds an info log to the buffer', () => {
      LogRegistry.build();
      LogRegistry.info('info msg');
      const logs = LogRegistry.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('info msg');
    });
  });

  describe('.warn', () => {
    it('adds a warn log to the buffer', () => {
      LogRegistry.build();
      LogRegistry.warn('warn msg');
      const logs = LogRegistry.getLogsByLevel('warn');
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('warn msg');
    });
  });

  describe('.error', () => {
    it('adds an error log to the buffer', () => {
      LogRegistry.build();
      LogRegistry.error('err msg');
      const logs = LogRegistry.getLogsByLevel('error');
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('err msg');
    });
  });

  describe('.getLogs', () => {
    it('throws if not built', () => {
      expect(() => LogRegistry.getLogs()).toThrowError(/not been built/);
    });

    it('returns an empty array when no logs have been added', () => {
      LogRegistry.build();
      expect(LogRegistry.getLogs()).toEqual([]);
    });

    describe('when lastId is provided', () => {
      beforeEach(() => {
        LogRegistry.build();
        LogRegistry.info('first');
        LogRegistry.warn('second');
        LogRegistry.info('third');
      });

      it('returns only logs newer than lastId', () => {
        const secondId = LogRegistry.getLogs()[1].id;
        const logs = LogRegistry.getLogs({ lastId: secondId });
        expect(logs.length).toBe(1);
        expect(logs[0].message).toBe('third');
      });

      it('returns an empty array when lastId is not found', () => {
        expect(LogRegistry.getLogs({ lastId: 99999 })).toEqual([]);
      });

      it('returns an empty array when lastId is the most recent log', () => {
        const logs = LogRegistry.getLogs();
        const lastId = logs[logs.length - 1].id;
        expect(LogRegistry.getLogs({ lastId })).toEqual([]);
      });
    });
  });

  describe('.getLogById', () => {
    it('returns the log with the matching ID', () => {
      LogRegistry.build();
      LogRegistry.info('message');
      const log = LogRegistry.getLogs()[0];
      expect(LogRegistry.getLogById(log.id)).toBe(log);
    });
  });

  describe('.getLogsByLevel', () => {
    it('returns logs filtered by level', () => {
      LogRegistry.build();
      LogRegistry.info('info msg');
      LogRegistry.warn('warn msg');
      const infoLogs = LogRegistry.getLogsByLevel('info');
      expect(infoLogs.length).toBe(1);
      expect(infoLogs[0].level).toBe('info');
    });
  });

  describe('.getLogsJSON', () => {
    it('returns logs as plain objects', () => {
      LogRegistry.build();
      LogRegistry.info('msg');
      const json = LogRegistry.getLogsJSON();
      expect(Array.isArray(json)).toBeTrue();
      expect(typeof json[0].id).toBe('number');
    });
  });
});
