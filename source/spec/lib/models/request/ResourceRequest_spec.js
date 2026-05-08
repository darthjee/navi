import { JobRegistry } from '../../../../lib/background/JobRegistry.js';
import { AssetRequest } from '../../../../lib/models/request/AssetRequest.js';
import { ResourceRequest } from '../../../../lib/models/request/ResourceRequest.js';
import { ResponseWrapper } from '../../../../lib/models/response/ResponseWrapper.js';
import { Application } from '../../../../lib/services/Application.js';
import { AssetRequestFactory } from '../../../support/factories/AssetRequestFactory.js';
import { ClientRegistryFactory } from '../../../support/factories/ClientRegistryFactory.js';
import { ResourceRequestActionFactory } from '../../../support/factories/ResourceRequestActionFactory.js';
import { ResourceRequestFactory } from '../../../support/factories/ResourceRequestFactory.js';
import { LoggerUtils } from '../../../support/utils/LoggerUtils.js';
import { RegistryCleanupUtils } from '../../../support/utils/RegistryCleanupUtils.js';

const buildResponseWrapper = (data) => new ResponseWrapper({ data, headers: {} });

const setupJobRegistrySpy = () => {
  LoggerUtils.stubLoggerMethods();
  JobRegistry.build({ cooldown: -1 });
  spyOn(JobRegistry, 'enqueue').and.stub();
};

describe('ResourceRequest', () => {
  describe('.fromList', () => {
    it('returns ResourceRequest instances with mapped attributes', () => {
      const resourceRequests = ResourceRequest.fromList([
        { url: '/categories.json', status: 200 },
        { url: '/categories.html', status: 302 },
      ]);

      expect(resourceRequests).toEqual([
        ResourceRequestFactory.build(),
        ResourceRequestFactory.build({ url: '/categories.html', status: 302 }),
      ]);
      expect(resourceRequests.every((resourceRequest) => resourceRequest instanceof ResourceRequest)).toBeTrue();
    });

    it('assigns the given clientName to each ResourceRequest', () => {
      const resourceRequests = ResourceRequest.fromList([
        { url: '/categories.json', status: 200 },
        { url: '/categories.html', status: 302 },
      ], { clientName: 'myClient' });
      const allResourceRequestsUseClient = resourceRequests.every((resourceRequest) => {
        return resourceRequest.clientName === 'myClient';
      });

      expect(allResourceRequestsUseClient).toBeTrue();
    });

    it('passes actions through to each ResourceRequest', () => {
      const [resourceRequest] = ResourceRequest.fromList([
        { url: '/categories.json', status: 200, actions: [{ resource: 'products' }] },
      ]);
      expect(resourceRequest.actions.length).toBe(1);
    });

    describe('with assets', () => {
      it('parses assets into AssetRequest instances', () => {
        const [resourceRequest] = ResourceRequest.fromList([
          { url: '/', status: 200, assets: [{ selector: 'link[rel="stylesheet"]', attribute: 'href' }] },
        ]);
        expect(resourceRequest.assets.length).toBe(1);
        expect(resourceRequest.assets[0]).toBeInstanceOf(AssetRequest);
      });

      it('sets an empty assets array when the key is absent', () => {
        const [resourceRequest] = ResourceRequest.fromList([{ url: '/', status: 200 }]);
        expect(resourceRequest.assets).toEqual([]);
        expect(resourceRequest.hasAssets()).toBeFalse();
      });
    });
  });

  describe('#clientName', () => {
    it('returns undefined when no clientName is set', () => {
      expect(ResourceRequestFactory.build().clientName).toBeUndefined();
    });

    it('returns the clientName when set', () => {
      expect(ResourceRequestFactory.build({ clientName: 'myClient' }).clientName).toBe('myClient');
    });
  });

  describe('#resolveUrl', () => {
    [
      {
        description: 'when there are no placeholders and no parameters',
        url: '/categories.json',
        parameters: {},
        expectedUrl: '/categories.json',
      },
      {
        description: 'when there is a single placeholder',
        url: '/categories/{:id}.json',
        parameters: { id: 1 },
        expectedUrl: '/categories/1.json',
      },
      {
        description: 'when there are multiple placeholders',
        url: '/categories/{:cat}/items/{:item}',
        parameters: { cat: 5, item: 3 },
        expectedUrl: '/categories/5/items/3',
      },
      {
        description: 'when no matching key exists',
        url: '/categories/{:id}.json',
        parameters: {},
        expectedUrl: '/categories/{:id}.json',
      },
      {
        description: 'when extra parameters are given for a plain URL',
        url: '/categories.json',
        parameters: { id: 1 },
        expectedUrl: '/categories.json',
      },
      {
        description: 'when called without arguments',
        url: '/categories/{:id}.json',
        expectedUrl: '/categories/{:id}.json',
      },
    ].forEach(({ description, url, parameters, expectedUrl }) => {
      it(`returns the expected URL ${description}`, () => {
        const request = ResourceRequestFactory.build({ url });
        expect(request.resolveUrl(parameters)).toEqual(expectedUrl);
      });
    });
  });

  describe('#needsParams', () => {
    [
      { description: 'when the URL has no placeholders', url: '/categories.json', expected: false },
      { description: 'when the URL has one placeholder', url: '/categories/{:id}.json', expected: true },
      {
        description: 'when the URL has multiple placeholders',
        url: '/categories/{:id}/items/{:item_id}',
        expected: true,
      },
      { description: 'for an empty URL', url: '', expected: false },
      {
        description: 'for a malformed placeholder without the colon prefix',
        url: '/categories/{id}.json',
        expected: false,
      },
    ].forEach(({ description, url, expected }) => {
      it(`returns ${expected} ${description}`, () => {
        expect(ResourceRequestFactory.build({ url }).needsParams()).toBe(expected);
      });
    });
  });

  describe('#enqueueActions', () => {
    let action;
    let request;

    beforeEach(() => {
      setupJobRegistrySpy();
      action = ResourceRequestActionFactory.build({ resource: 'products' });
    });

    afterEach(() => {
      RegistryCleanupUtils.resetJobRegistry();
    });

    it('returns without errors when there are no actions', () => {
      request = ResourceRequestFactory.build();
      expect(() => request.enqueueActions(buildResponseWrapper('not valid json'))).not.toThrow();
    });

    it('does not enqueue anything when there are no actions', () => {
      request = ResourceRequestFactory.build();
      request.enqueueActions(buildResponseWrapper('[]'));
      expect(JobRegistry.enqueue).not.toHaveBeenCalled();
    });

    [
      {
        description: 'when the response is a JSON array',
        body: '[{"id":1},{"id":2}]',
        assertion: () => expect(JobRegistry.enqueue).toHaveBeenCalledTimes(2),
      },
      {
        description: 'when the response is a JSON object',
        body: '{"id":1}',
        assertion: () => expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith(
          'Action',
          jasmine.objectContaining({ action }),
        ),
      },
    ].forEach(({ description, body, assertion }) => {
      it(`enqueues the expected jobs ${description}`, () => {
        request = ResourceRequestFactory.build({ actions: [{ resource: 'products' }] });
        request.actions = [action];
        request.enqueueActions(buildResponseWrapper(body));
        assertion();
      });
    });
  });

  describe('#hasAssets', () => {
    it('returns false when the assets list is empty', () => {
      expect(ResourceRequestFactory.build().hasAssets()).toBeFalse();
    });

    it('returns true when the assets list is non-empty', () => {
      const request = new ResourceRequest({
        url: '/',
        status: 200,
        assets: [{ selector: 'link[rel="stylesheet"]', attribute: 'href' }],
      });

      expect(request.hasAssets()).toBeTrue();
    });
  });

  describe('#enqueueAssets', () => {
    let request;
    let jobRegistry;
    let clientRegistry;

    beforeEach(() => {
      LoggerUtils.stubLoggerMethods();
      jobRegistry = jasmine.createSpyObj('jobRegistry', ['enqueue']);
      clientRegistry = ClientRegistryFactory.build();
      request = new ResourceRequest({
        url: '/',
        status: 200,
        assets: [{ selector: 'link[rel="stylesheet"]', attribute: 'href' }],
      });
    });

    it('enqueues one HtmlParseJob with the rawHtml and assetRequests', () => {
      const rawHtml = '<html><head><link rel="stylesheet" href="/a.css"></head></html>';
      request.enqueueAssets(rawHtml, jobRegistry, clientRegistry);

      expect(jobRegistry.enqueue).toHaveBeenCalledOnceWith('HtmlParse', jasmine.objectContaining({
        rawHtml,
        assetRequests: request.assets,
        clientRegistry,
      }));
    });

    it('passes the assetRequests from the request', () => {
      const assetRequest = AssetRequestFactory.build();

      request.assets = [assetRequest];
      request.enqueueAssets('<html></html>', jobRegistry, clientRegistry);
      expect(jobRegistry.enqueue).toHaveBeenCalledWith(
        'HtmlParse',
        jasmine.objectContaining({ assetRequests: [assetRequest] }),
      );
    });

    it('does not enqueue jobs when the application is stopped', () => {
      spyOn(Application, 'isStopped').and.returnValue(true);
      request.enqueueAssets('<html></html>', jobRegistry, clientRegistry);
      expect(jobRegistry.enqueue).not.toHaveBeenCalled();
    });
  });

  describe('#enqueuePaginatedActions', () => {
    let paginatedAction;
    let request;

    beforeEach(() => {
      setupJobRegistrySpy();
      paginatedAction = jasmine.createSpyObj('paginatedAction', ['execute']);
      request = ResourceRequestFactory.build();
      request.paginatedActions = [paginatedAction];
    });

    afterEach(() => {
      RegistryCleanupUtils.resetJobRegistry();
    });

    it('does not enqueue anything when there are no paginated actions', () => {
      request.paginatedActions = [];
      request.enqueuePaginatedActions(buildResponseWrapper('[]'));
      expect(JobRegistry.enqueue).not.toHaveBeenCalled();
    });

    it('calls enqueue once per paginated action', () => {
      request.enqueuePaginatedActions(buildResponseWrapper('[{"id":1},{"id":2}]'));
      expect(JobRegistry.enqueue).toHaveBeenCalledTimes(1);
    });

    it('enqueues the paginated action with wrapper and parameters', () => {
      const wrapper = buildResponseWrapper('{"id":1}');
      const parameters = { category_id: 5 };
      request.enqueuePaginatedActions(wrapper, parameters);
      expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith(
        'PaginatedAction',
        jasmine.objectContaining({ paginatedAction, responseWrapper: wrapper, parameters }),
      );
    });
  });
});
