import { LogRegistryInstance } from '../../../lib/registry/LogRegistryInstance.js';
import { EngineEvents } from '../../../lib/services/EngineEvents.js';
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
    EngineEvents.reset();
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

  describe('#getLogsByJobId', () => {
    it('returns an empty array when no logs have been added for that job', () => {
      expect(instance.getLogsByJobId('job-99')).toEqual([]);
    });

    it('returns logs that were dispatched with a matching jobId attribute', () => {
      instance.info('job log', { jobId: 'job-1' });
      const logs = instance.getLogsByJobId('job-1');
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('job log');
    });

    it('does not include logs dispatched without a jobId', () => {
      instance.info('no job');
      instance.info('with job', { jobId: 'job-1' });
      expect(instance.getLogsByJobId('job-1').length).toBe(1);
    });

    it('does not mix logs across different job IDs', () => {
      instance.info('job a log', { jobId: 'job-a' });
      instance.info('job b log', { jobId: 'job-b' });
      expect(instance.getLogsByJobId('job-a').length).toBe(1);
      expect(instance.getLogsByJobId('job-b').length).toBe(1);
    });

    it('stores the same Log instance as the default buffer', () => {
      instance.info('shared log', { jobId: 'job-1' });
      const defaultLog = instance.getLogs()[0];
      const jobLog = instance.getLogsByJobId('job-1')[0];
      expect(jobLog).toBe(defaultLog);
    });
  });

  describe('#getLogsByWorkerId', () => {
    it('returns an empty array when no logs have been added for that worker', () => {
      expect(instance.getLogsByWorkerId('worker-99')).toEqual([]);
    });

    it('returns logs that were dispatched with a matching workerId attribute', () => {
      instance.info('worker log', { workerId: 'worker-1' });
      const logs = instance.getLogsByWorkerId('worker-1');
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('worker log');
    });

    it('routes to both job and worker collections when both attributes are present', () => {
      instance.info('both', { jobId: 'job-1', workerId: 'worker-1' });
      expect(instance.getLogsByJobId('job-1').length).toBe(1);
      expect(instance.getLogsByWorkerId('worker-1').length).toBe(1);
    });

    it('stores the same Log instance as the default buffer', () => {
      instance.info('shared log', { workerId: 'worker-1' });
      const defaultLog = instance.getLogs()[0];
      const workerLog = instance.getLogsByWorkerId('worker-1')[0];
      expect(workerLog).toBe(defaultLog);
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
