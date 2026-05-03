import { LogRegistry } from '../../../../lib/registry/LogRegistry.js';
import { LogContext } from '../../../../lib/utils/logging/LogContext.js';
import { Logger } from '../../../../lib/utils/logging/Logger.js';

describe('LogContext', () => {
  let ctx;

  beforeEach(() => {
    Logger.suppress();
    spyOn(LogRegistry, 'debug').and.stub();
    spyOn(LogRegistry, 'info').and.stub();
    spyOn(LogRegistry, 'warn').and.stub();
    spyOn(LogRegistry, 'error').and.stub();
    ctx = new LogContext({ workerId: 'w1', jobId: 42 });
  });

  afterEach(() => {
    Logger.reset();
  });

  describe('#debug', () => {
    it('delegates to LogRegistry.debug with context attributes', () => {
      ctx.debug('debug msg');
      expect(LogRegistry.debug).toHaveBeenCalledWith('debug msg', { workerId: 'w1', jobId: 42 });
    });

    it('merges per-call attributes with context attributes', () => {
      ctx.debug('debug msg', { url: '/foo' });
      expect(LogRegistry.debug).toHaveBeenCalledWith('debug msg', { workerId: 'w1', jobId: 42, url: '/foo' });
    });
  });

  describe('#info', () => {
    it('delegates to LogRegistry.info with context attributes', () => {
      ctx.info('info msg');
      expect(LogRegistry.info).toHaveBeenCalledWith('info msg', { workerId: 'w1', jobId: 42 });
    });

    it('merges per-call attributes with context attributes', () => {
      ctx.info('info msg', { url: '/bar' });
      expect(LogRegistry.info).toHaveBeenCalledWith('info msg', { workerId: 'w1', jobId: 42, url: '/bar' });
    });
  });

  describe('#warn', () => {
    it('delegates to LogRegistry.warn with context attributes', () => {
      ctx.warn('warn msg');
      expect(LogRegistry.warn).toHaveBeenCalledWith('warn msg', { workerId: 'w1', jobId: 42 });
    });
  });

  describe('#error', () => {
    it('delegates to LogRegistry.error with context attributes', () => {
      ctx.error('error msg');
      expect(LogRegistry.error).toHaveBeenCalledWith('error msg', { workerId: 'w1', jobId: 42 });
    });

    it('merges per-call attributes with context attributes', () => {
      ctx.error('error msg', { code: 500 });
      expect(LogRegistry.error).toHaveBeenCalledWith('error msg', { workerId: 'w1', jobId: 42, code: 500 });
    });
  });
});
