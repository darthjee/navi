import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';

describe('LogRegistry', () => {
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

    it('wires the BufferedLogger into Logger', () => {
      LogRegistry.build();
      Logger.info('test message');
      const logs = LogRegistry.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('test message');
    });
  });

  describe('.reset', () => {
    it('allows build to be called again', () => {
      LogRegistry.build();
      LogRegistry.reset();
      expect(() => LogRegistry.build()).not.toThrow();
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
  });

  describe('.getLogById', () => {
    it('returns the log with the matching ID', () => {
      LogRegistry.build();
      Logger.info('message');
      const log = LogRegistry.getLogs()[0];
      expect(LogRegistry.getLogById(log.id)).toBe(log);
    });
  });

  describe('.getLogsByLevel', () => {
    it('returns logs filtered by level', () => {
      LogRegistry.build();
      Logger.info('info msg');
      Logger.warn('warn msg');
      const infoLogs = LogRegistry.getLogsByLevel('info');
      expect(infoLogs.length).toBe(1);
      expect(infoLogs[0].level).toBe('info');
    });
  });

  describe('.getLogsJSON', () => {
    it('returns logs as plain objects', () => {
      LogRegistry.build();
      Logger.info('msg');
      const json = LogRegistry.getLogsJSON();
      expect(Array.isArray(json)).toBeTrue();
      expect(typeof json[0].id).toBe('number');
    });
  });
});
