import { LogRegistryInstance } from '../../../lib/registry/LogRegistryInstance.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { LoggerUtils } from '../../support/utils/LoggerUtils.js';

describe('LogRegistryInstance', () => {
  let instance;

  beforeEach(() => {
    LoggerUtils.stubConsoleMethods();
    instance = new LogRegistryInstance({ retention: 10 });
  });

  afterEach(() => {
    Logger.reset();
  });

  describe('#bufferedLogger', () => {
    it('returns the underlying BufferedLogger', () => {
      expect(instance.bufferedLogger).toBeDefined();
    });
  });

  describe('#debug', () => {
    it('stores the message in the buffer', () => {
      const debugInstance = new LogRegistryInstance({ retention: 10, level: 'debug' });
      debugInstance.debug('dbg message');
      const logs = debugInstance.getLogsByLevel('debug');
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('dbg message');
    });
  });

  describe('#error', () => {
    it('stores the message in the buffer', () => {
      instance.error('error message');
      const logs = instance.getLogsByLevel('error');
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('error message');
    });
  });

  describe('#info', () => {
    it('stores the message in the buffer', () => {
      instance.info('info message');
      const logs = instance.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('info message');
    });
  });

  describe('#warn', () => {
    it('stores the message in the buffer', () => {
      instance.warn('warn message');
      const logs = instance.getLogsByLevel('warn');
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('warn message');
    });
  });

  describe('#getLogs', () => {
    it('returns an empty array when no logs have been added', () => {
      expect(instance.getLogs()).toEqual([]);
    });

    it('returns logs in chronological order after logging', () => {
      instance.info('first');
      instance.warn('second');
      const logs = instance.getLogs();
      expect(logs[0].message).toBe('first');
      expect(logs[1].message).toBe('second');
    });

    describe('when lastId is provided', () => {
      it('delegates filtering to LogFilter and returns the subset', () => {
        instance.info('first');
        instance.warn('second');
        instance.info('third');
        const secondId = instance.getLogs()[1].id;
        const logs = instance.getLogs({ lastId: secondId });
        expect(logs.length).toBe(1);
        expect(logs[0].message).toBe('third');
      });
    });
  });

  describe('#getLogById', () => {
    it('returns the log with the matching ID', () => {
      instance.info('message');
      const log = instance.getLogs()[0];
      expect(instance.getLogById(log.id)).toBe(log);
    });

    it('returns undefined for an unknown ID', () => {
      expect(instance.getLogById(999)).toBeUndefined();
    });
  });

  describe('#getLogsByLevel', () => {
    it('returns only logs matching the given level', () => {
      instance.info('info message');
      instance.warn('warn message');
      const infoLogs = instance.getLogsByLevel('info');
      expect(infoLogs.length).toBe(1);
      expect(infoLogs[0].level).toBe('info');
    });
  });

  describe('#getLogsJSON', () => {
    it('returns an array of plain objects', () => {
      instance.info('message');
      const json = instance.getLogsJSON();
      expect(Array.isArray(json)).toBeTrue();
      expect(typeof json[0].id).toBe('number');
      expect(json[0].level).toBe('info');
      expect(json[0].message).toBe('message');
    });
  });
});
