import { RequestHandlerExecutor } from '../../../../lib/common/server/RequestHandlerExecutor.js';

describe('RequestHandlerExecutor', () => {
  describe('#handle', () => {
    it('is a no-op', () => {
      const executor = new RequestHandlerExecutor();
      expect(() => executor.handle()).not.toThrow();
    });

    it('allows subclasses to override handle', () => {
      class MyExecutor extends RequestHandlerExecutor {
        handle() { this.result = 'ok'; }
      }
      const executor = new MyExecutor();
      executor.handle();
      expect(executor.result).toBe('ok');
    });

    it('is an instance of RequestHandlerExecutor when subclassed', () => {
      class MyExecutor extends RequestHandlerExecutor {}
      expect(new MyExecutor()).toBeInstanceOf(RequestHandlerExecutor);
    });
  });
});
