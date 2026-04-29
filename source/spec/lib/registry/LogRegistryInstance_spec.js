import { LogRegistryInstance } from '../../../lib/registry/LogRegistryInstance.js';

describe('LogRegistryInstance', () => {
  let instance;

  beforeEach(() => {
    instance = new LogRegistryInstance({ retention: 10 });
  });

  describe('#bufferedLogger', () => {
    it('returns the underlying BufferedLogger', () => {
      expect(instance.bufferedLogger).toBeDefined();
    });
  });

  describe('#getLogs', () => {
    it('returns an empty array when no logs have been added', () => {
      expect(instance.getLogs()).toEqual([]);
    });

    it('returns logs in chronological order after logging', () => {
      instance.bufferedLogger.info('first');
      instance.bufferedLogger.warn('second');
      const logs = instance.getLogs();
      expect(logs[0].message).toBe('first');
      expect(logs[1].message).toBe('second');
    });

    describe('when lastId is provided', () => {
      beforeEach(() => {
        instance.bufferedLogger.info('first');
        instance.bufferedLogger.warn('second');
        instance.bufferedLogger.info('third');
      });

      it('returns only logs newer than lastId', () => {
        const secondId = instance.getLogs()[1].id;
        const logs = instance.getLogs({ lastId: secondId });
        expect(logs.length).toBe(1);
        expect(logs[0].message).toBe('third');
      });

      it('accepts lastId as a string', () => {
        const secondId = String(instance.getLogs()[1].id);
        const logs = instance.getLogs({ lastId: secondId });
        expect(logs.length).toBe(1);
        expect(logs[0].message).toBe('third');
      });

      it('returns an empty array when lastId is not found', () => {
        expect(instance.getLogs({ lastId: 99999 })).toEqual([]);
      });

      it('returns an empty array when lastId is the most recent log', () => {
        const logs = instance.getLogs();
        const lastId = logs[logs.length - 1].id;
        expect(instance.getLogs({ lastId })).toEqual([]);
      });
    });
  });

  describe('#getLogById', () => {
    it('returns the log with the matching ID', () => {
      instance.bufferedLogger.info('message');
      const log = instance.getLogs()[0];
      expect(instance.getLogById(log.id)).toBe(log);
    });

    it('returns undefined for an unknown ID', () => {
      expect(instance.getLogById(999)).toBeUndefined();
    });
  });

  describe('#getLogsByLevel', () => {
    it('returns only logs matching the given level', () => {
      instance.bufferedLogger.info('info message');
      instance.bufferedLogger.warn('warn message');
      const infoLogs = instance.getLogsByLevel('info');
      expect(infoLogs.length).toBe(1);
      expect(infoLogs[0].level).toBe('info');
    });
  });

  describe('#getLogsJSON', () => {
    it('returns an array of plain objects', () => {
      instance.bufferedLogger.info('message');
      const json = instance.getLogsJSON();
      expect(Array.isArray(json)).toBeTrue();
      expect(typeof json[0].id).toBe('number');
      expect(json[0].level).toBe('info');
      expect(json[0].message).toBe('message');
    });
  });
});
