/* eslint-disable no-console */
import { LoggerGroup } from '../../lib/utils/LoggerGroup.js';

describe('LoggerGroup', () => {
  let loggerA;
  let loggerB;

  beforeEach(() => {
    loggerA = {
      debug: jasmine.createSpy('debug'),
      info: jasmine.createSpy('info'),
      warn: jasmine.createSpy('warn'),
      error: jasmine.createSpy('error'),
    };

    loggerB = {
      debug: jasmine.createSpy('debug'),
      info: jasmine.createSpy('info'),
      warn: jasmine.createSpy('warn'),
      error: jasmine.createSpy('error'),
    };
  });

  describe('constructor', () => {
    it('creates an empty group when no arguments are provided', () => {
      const group = new LoggerGroup();
      expect(group.getLoggers()).toEqual([]);
    });

    it('creates a group with the provided loggers', () => {
      const group = new LoggerGroup([loggerA, loggerB]);
      expect(group.getLoggers()).toEqual([loggerA, loggerB]);
    });
  });

  describe('#addLogger', () => {
    it('adds a logger to the group', () => {
      const group = new LoggerGroup();
      group.addLogger(loggerA);
      expect(group.getLoggers()).toEqual([loggerA]);
    });

    it('returns this for method chaining', () => {
      const group = new LoggerGroup();
      const result = group.addLogger(loggerA);
      expect(result).toBe(group);
    });
  });

  describe('#removeLogger', () => {
    it('removes a logger from the group', () => {
      const group = new LoggerGroup([loggerA, loggerB]);
      group.removeLogger(loggerA);
      expect(group.getLoggers()).toEqual([loggerB]);
    });

    it('returns this for method chaining', () => {
      const group = new LoggerGroup([loggerA]);
      const result = group.removeLogger(loggerA);
      expect(result).toBe(group);
    });

    it('does not affect other loggers', () => {
      const group = new LoggerGroup([loggerA, loggerB]);
      group.removeLogger(loggerA);
      expect(group.getLoggers()).toContain(loggerB);
    });
  });

  describe('#getLoggers', () => {
    it('returns a copy of the internal loggers array', () => {
      const group = new LoggerGroup([loggerA]);
      const loggers = group.getLoggers();
      loggers.push(loggerB);
      expect(group.getLoggers()).toEqual([loggerA]);
    });
  });

  describe('#debug', () => {
    it('calls debug on all loggers', () => {
      const group = new LoggerGroup([loggerA, loggerB]);
      group.debug('test message');
      expect(loggerA.debug).toHaveBeenCalledWith('test message');
      expect(loggerB.debug).toHaveBeenCalledWith('test message');
    });

    it('does not throw when group is empty', () => {
      const group = new LoggerGroup();
      expect(() => group.debug('msg')).not.toThrow();
    });
  });

  describe('#info', () => {
    it('calls info on all loggers', () => {
      const group = new LoggerGroup([loggerA, loggerB]);
      group.info('test message');
      expect(loggerA.info).toHaveBeenCalledWith('test message');
      expect(loggerB.info).toHaveBeenCalledWith('test message');
    });

    it('does not throw when group is empty', () => {
      const group = new LoggerGroup();
      expect(() => group.info('msg')).not.toThrow();
    });
  });

  describe('#warn', () => {
    it('calls warn on all loggers', () => {
      const group = new LoggerGroup([loggerA, loggerB]);
      group.warn('test message');
      expect(loggerA.warn).toHaveBeenCalledWith('test message');
      expect(loggerB.warn).toHaveBeenCalledWith('test message');
    });

    it('does not throw when group is empty', () => {
      const group = new LoggerGroup();
      expect(() => group.warn('msg')).not.toThrow();
    });
  });

  describe('#error', () => {
    it('calls error on all loggers', () => {
      const group = new LoggerGroup([loggerA, loggerB]);
      group.error('test message');
      expect(loggerA.error).toHaveBeenCalledWith('test message');
      expect(loggerB.error).toHaveBeenCalledWith('test message');
    });

    it('does not throw when group is empty', () => {
      const group = new LoggerGroup();
      expect(() => group.error('msg')).not.toThrow();
    });
  });

  describe('#suppress', () => {
    beforeEach(() => {
      loggerA.suppress = jasmine.createSpy('suppress');
      loggerB.suppress = jasmine.createSpy('suppress');
    });

    it('calls suppress on all loggers', () => {
      const group = new LoggerGroup([loggerA, loggerB]);
      group.suppress(true);
      expect(loggerA.suppress).toHaveBeenCalledWith(true);
      expect(loggerB.suppress).toHaveBeenCalledWith(true);
    });

    it('defaults value to true', () => {
      const group = new LoggerGroup([loggerA]);
      group.suppress();
      expect(loggerA.suppress).toHaveBeenCalledWith(true);
    });

    it('does not throw when group is empty', () => {
      const group = new LoggerGroup();
      expect(() => group.suppress(true)).not.toThrow();
    });
  });

  describe('#setLevel', () => {
    beforeEach(() => {
      loggerA.setLevel = jasmine.createSpy('setLevel');
      loggerB.setLevel = jasmine.createSpy('setLevel');
    });

    it('calls setLevel on all loggers', () => {
      const group = new LoggerGroup([loggerA, loggerB]);
      group.setLevel('debug');
      expect(loggerA.setLevel).toHaveBeenCalledWith('debug');
      expect(loggerB.setLevel).toHaveBeenCalledWith('debug');
    });

    it('does not throw when group is empty', () => {
      const group = new LoggerGroup();
      expect(() => group.setLevel('debug')).not.toThrow();
    });
  });
});
