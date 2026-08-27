import { ClientNotFound } from '../../../../../lib/exceptions/registry/ClientNotFound.js';
import { ResourceNotFound } from '../../../../../lib/exceptions/registry/ResourceNotFound.js';
import { NamespaceMap } from '../../../../../lib/registry/NamespaceMap.js';
import { ApiConfigHandler } from '../../../../../lib/server/handlers/api/ApiConfigHandler.js';
import { SecuredRequestHandler } from '../../../../../lib/server/SecuredRequestHandler.js';
import { Application } from '../../../../../lib/services/application/Application.js';
import { ResourceEnqueuer } from '../../../../../lib/utils/ResourceEnqueuer.js';

describe('ApiConfigHandler', () => {
  let res;
  let jsonSpy;
  let statusSpy;

  beforeEach(() => {
    jsonSpy = jasmine.createSpy('json');
    statusSpy = jasmine.createSpy('status').and.returnValue({ json: jsonSpy });
    res = { json: jsonSpy, status: statusSpy };
    spyOn(NamespaceMap, 'include').and.stub();
    spyOn(Application, 'isRunning').and.returnValue(false);
    spyOn(ResourceEnqueuer.prototype, 'enqueue').and.returnValue({ enqueued: [], skippedResources: [] });
  });

  afterEach(() => {
    Application.reset();
  });

  it('is an instance of SecuredRequestHandler', () => {
    const req = { body: { namespace: 'reports' } };
    expect(new ApiConfigHandler(req, res, 'token')).toBeInstanceOf(SecuredRequestHandler);
  });

  describe('#process', () => {
    describe('when namespace is missing', () => {
      it('responds with 400', () => {
        const req = { body: {} };
        new ApiConfigHandler(req, res, 'token').process();
        expect(statusSpy).toHaveBeenCalledWith(400);
      });

      it('does not call NamespaceMap.include', () => {
        const req = { body: {} };
        new ApiConfigHandler(req, res, 'token').process();
        expect(NamespaceMap.include).not.toHaveBeenCalled();
      });
    });

    describe('when namespace is an empty string', () => {
      it('responds with 400', () => {
        const req = { body: { namespace: '   ' } };
        new ApiConfigHandler(req, res, 'token').process();
        expect(statusSpy).toHaveBeenCalledWith(400);
      });
    });

    describe('when namespace is not a string', () => {
      it('responds with 400', () => {
        const req = { body: { namespace: 42 } };
        new ApiConfigHandler(req, res, 'token').process();
        expect(statusSpy).toHaveBeenCalledWith(400);
      });
    });

    describe('when resources is not an object', () => {
      it('responds with 400', () => {
        const req = { body: { namespace: 'reports', resources: ['not-an-object'] } };
        new ApiConfigHandler(req, res, 'token').process();
        expect(statusSpy).toHaveBeenCalledWith(400);
      });
    });

    describe('when clients is not an object', () => {
      it('responds with 400', () => {
        const req = { body: { namespace: 'reports', clients: 'not-an-object' } };
        new ApiConfigHandler(req, res, 'token').process();
        expect(statusSpy).toHaveBeenCalledWith(400);
      });
    });

    describe('when the payload is valid', () => {
      it('merges the namespace via NamespaceMap.include, defaulting missing resources/clients to {}', () => {
        const req = { body: { namespace: 'reports' } };
        new ApiConfigHandler(req, res, 'token').process();

        expect(NamespaceMap.include).toHaveBeenCalledWith([
          { namespace: 'reports', resources: {}, clients: {} },
        ]);
      });

      it('merges the given resources/clients', () => {
        const req = {
          body: {
            namespace: 'reports',
            resources: { categories: [{ url: '/categories.json', status: 200 }] },
            clients: { default: { base_url: 'https://example.com' } },
          },
        };
        new ApiConfigHandler(req, res, 'token').process();

        expect(NamespaceMap.include).toHaveBeenCalledWith([
          {
            namespace: 'reports',
            resources: { categories: [{ url: '/categories.json', status: 200 }] },
            clients: { default: { base_url: 'https://example.com' } },
          },
        ]);
      });

      it('responds with accepted status', () => {
        const req = { body: { namespace: 'reports' } };
        new ApiConfigHandler(req, res, 'token').process();
        expect(jsonSpy).toHaveBeenCalledWith({ status: 'accepted' });
      });
    });

    describe('when NamespaceMap.include throws a known config/registry error', () => {
      it('responds with 400 and the error message for ResourceNotFound', () => {
        const error = new ResourceNotFound('missing');
        NamespaceMap.include.and.throwError(error);
        const req = { body: { namespace: 'reports' } };

        new ApiConfigHandler(req, res, 'token').process();

        expect(statusSpy).toHaveBeenCalledWith(400);
        expect(jsonSpy).toHaveBeenCalledWith({ error: error.message });
      });

      it('responds with 400 and the error message for ClientNotFound', () => {
        const error = new ClientNotFound('missing');
        NamespaceMap.include.and.throwError(error);
        const req = { body: { namespace: 'reports' } };

        new ApiConfigHandler(req, res, 'token').process();

        expect(statusSpy).toHaveBeenCalledWith(400);
        expect(jsonSpy).toHaveBeenCalledWith({ error: error.message });
      });

      it('does not enqueue anything', () => {
        NamespaceMap.include.and.throwError(new ResourceNotFound('missing'));
        const req = { body: { namespace: 'reports' } };

        new ApiConfigHandler(req, res, 'token').process();

        expect(ResourceEnqueuer.prototype.enqueue).not.toHaveBeenCalled();
      });
    });

    describe('when NamespaceMap.include throws an unexpected error', () => {
      it('rethrows it', () => {
        NamespaceMap.include.and.throwError(new Error('boom'));
        const req = { body: { namespace: 'reports' } };

        expect(() => new ApiConfigHandler(req, res, 'token').process()).toThrowError('boom');
      });
    });

    describe('when the engine is running', () => {
      beforeEach(() => {
        Application.isRunning.and.returnValue(true);
      });

      it('enqueues the param-free resources named in the payload, scoped to the target namespace', () => {
        const req = {
          body: {
            namespace: 'reports',
            resources: { categories: [{ url: '/categories.json', status: 200 }] },
          },
        };

        new ApiConfigHandler(req, res, 'token').process();

        expect(ResourceEnqueuer.prototype.enqueue).toHaveBeenCalledWith(['categories']);
      });
    });

    describe('when the engine is not running', () => {
      beforeEach(() => {
        Application.isRunning.and.returnValue(false);
      });

      it('does not enqueue anything', () => {
        const req = {
          body: {
            namespace: 'reports',
            resources: { categories: [{ url: '/categories.json', status: 200 }] },
          },
        };

        new ApiConfigHandler(req, res, 'token').process();

        expect(ResourceEnqueuer.prototype.enqueue).not.toHaveBeenCalled();
      });
    });

    describe('when the payload contains a literal env var reference', () => {
      const originalValue = process.env.SOME_VAR;

      beforeEach(() => {
        process.env.SOME_VAR = 'resolved-value';
        NamespaceMap.include.and.callThrough();
        NamespaceMap.build({});
      });

      afterEach(() => {
        if (originalValue === undefined) {
          delete process.env.SOME_VAR;
        } else {
          process.env.SOME_VAR = originalValue;
        }
        NamespaceMap.reset();
      });

      it('stores the literal, unresolved value, never resolving env vars on the API path', () => {
        const req = {
          body: {
            namespace: 'reports',
            resources: { categories: [{ url: '${SOME_VAR}', status: 200 }] },
          },
        };

        new ApiConfigHandler(req, res, 'token').process();

        const resource = NamespaceMap.getResource('reports', 'categories');
        expect(resource.resourceRequests[0].url).toEqual('${SOME_VAR}');
      });
    });
  });
});
