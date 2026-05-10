import { HandlerConfig } from '../../../lib/server/HandlerConfig.js';

describe('HandlerConfig', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};
    res = { json: jasmine.createSpy('json') };
  });

  describe('#handle', () => {
    it('instantiates the handler class with the given parameters and delegates', () => {
      const handleSpy = jasmine.createSpy('handle');
      let receivedParams;

      class FakeHandler {
        constructor(params) { receivedParams = params; }
        handle(r, s) { handleSpy(r, s); }
      }

      const config = new HandlerConfig(FakeHandler, { foo: 'bar' });
      config.handle(req, res);

      expect(receivedParams).toEqual({ foo: 'bar' });
      expect(handleSpy).toHaveBeenCalledWith(req, res);
    });

    it('creates a new handler instance on each call', () => {
      const instances = [];

      class FakeHandler {
        constructor() { instances.push(this); }
        handle() {}
      }

      const config = new HandlerConfig(FakeHandler, {});
      config.handle(req, res);
      config.handle(req, res);

      expect(instances.length).toBe(2);
      expect(instances[0]).not.toBe(instances[1]);
    });

    it('uses empty object as default parameters', () => {
      let receivedParams;

      class FakeHandler {
        constructor(params) { receivedParams = params; }
        handle() {}
      }

      const config = new HandlerConfig(FakeHandler);
      config.handle(req, res);

      expect(receivedParams).toEqual({});
    });
  });
});
