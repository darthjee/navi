import { HandlerConfig } from '../../../../lib/common/server/HandlerConfig.js';

describe('HandlerConfig', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};
    res = { json: jasmine.createSpy('json') };
  });

  describe('#handle', () => {
    it('instantiates the handler executor class with the given parameters and delegates', () => {
      const handleSpy = jasmine.createSpy('handle');
      let receivedReq;
      let receivedRes;
      let receivedParams;

      class FakeHandlerExecutor {
        constructor(request, response, ...params) {
          receivedReq = request;
          receivedRes = response;
          receivedParams = params;
        }

        handle() { handleSpy(); }
      }

      const config = new HandlerConfig(FakeHandlerExecutor, [{ foo: 'bar' }, 'baz']);
      config.handle(req, res);

      expect(receivedReq).toBe(req);
      expect(receivedRes).toBe(res);
      expect(receivedParams).toEqual([{ foo: 'bar' }, 'baz']);
      expect(handleSpy).toHaveBeenCalled();
    });

    it('creates a new handler executor instance on each call', () => {
      const instances = [];

      class FakeHandlerExecutor {
        constructor() { instances.push(this); }
        handle() {}
      }

      const config = new HandlerConfig(FakeHandlerExecutor, []);
      config.handle(req, res);
      config.handle(req, res);

      expect(instances.length).toBe(2);
      expect(instances[0]).not.toBe(instances[1]);
    });

    it('uses an empty list as default parameters', () => {
      let receivedParams;

      class FakeHandlerExecutor {
        constructor(_request, _response, ...params) { receivedParams = params; }
        handle() {}
      }

      const config = new HandlerConfig(FakeHandlerExecutor);
      config.handle(req, res);

      expect(receivedParams).toEqual([]);
    });

    it('wraps a single parameter into a list', () => {
      let receivedParams;

      class FakeHandlerExecutor {
        constructor(_request, _response, ...params) { receivedParams = params; }
        handle() {}
      }

      const config = new HandlerConfig(FakeHandlerExecutor, 'page-size');
      config.handle(req, res);

      expect(receivedParams).toEqual(['page-size']);
    });
  });
});
