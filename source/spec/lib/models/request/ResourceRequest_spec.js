import { JobRegistry } from 'deku-swarm';
import { AssetRequest } from '../../../../lib/models/request/AssetRequest.js';
import { ResourceRequest } from '../../../../lib/models/request/ResourceRequest.js';
import { ResponseWrapper } from '../../../../lib/models/response/ResponseWrapper.js';
import { LogRegistry } from '../../../../lib/registry/LogRegistry.js';
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
      const usesClientName = ({ clientName }) => clientName === 'myClient';

      expect(resourceRequests.every(usesClientName)).toBeTrue();
    });

    it('passes actions through to each ResourceRequest', () => {
      const resourceRequests = ResourceRequest.fromList([
        { url: '/categories.json', status: 200, actions: [{ resource: 'products' }] },
      ]);

      expect(resourceRequests[0].actions.length).toBe(1);
    });

    it('assigns the given namespace to each ResourceRequest, defaulting to "default"', () => {
      const [withNamespace] = ResourceRequest.fromList(
        [{ url: '/categories.json', status: 200 }],
        { namespace: 'paginated' },
      );
      const [withoutNamespace] = ResourceRequest.fromList([{ url: '/categories.json', status: 200 }]);

      expect(withNamespace.namespace).toBe('paginated');
      expect(withoutNamespace.namespace).toBe('default');
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

    it('returns the clientName when set as a bare string', () => {
      expect(ResourceRequestFactory.build({ clientName: 'myClient' }).clientName).toBe('myClient');
    });

    it('returns the name when set as an object with an explicit namespace', () => {
      const request = ResourceRequestFactory.build({ clientName: { name: 'myClient', namespace: 'clients' } });
      expect(request.clientName).toBe('myClient');
    });
  });

  describe('#clientNamespace', () => {
    it('returns null when no clientName is set', () => {
      expect(ResourceRequestFactory.build().clientNamespace).toBeNull();
    });

    it('returns null when clientName is a bare string (shorthand)', () => {
      expect(ResourceRequestFactory.build({ clientName: 'myClient' }).clientNamespace).toBeNull();
    });

    it('returns the explicit namespace when clientName is given as an object', () => {
      const request = ResourceRequestFactory.build({ clientName: { name: 'myClient', namespace: 'clients' } });
      expect(request.clientNamespace).toBe('clients');
    });
  });

  describe('#namespace', () => {
    it('defaults to "default"', () => {
      expect(ResourceRequestFactory.build().namespace).toBe('default');
    });

    it('returns the given namespace', () => {
      expect(ResourceRequestFactory.build({ namespace: 'paginated' }).namespace).toBe('paginated');
    });
  });

  describe('#disabled', () => {
    [
      { description: 'when neither enabled nor disabled is given', attrs: {}, expected: false },
      { description: 'when enabled is true', attrs: { enabled: true }, expected: false },
      { description: 'when enabled is false', attrs: { enabled: false }, expected: true },
      { description: 'when disabled is true', attrs: { disabled: true }, expected: true },
      { description: 'when disabled is false', attrs: { disabled: false }, expected: false },
      {
        description: 'when enabled is true and disabled is true (disabled wins)',
        attrs: { enabled: true, disabled: true },
        expected: true,
      },
      {
        description: 'when enabled is false and disabled is false',
        attrs: { enabled: false, disabled: false },
        expected: true,
      },
    ].forEach(({ description, attrs, expected }) => {
      it(`returns ${expected} ${description}`, () => {
        expect(ResourceRequestFactory.build(attrs).disabled).toBe(expected);
      });
    });
  });

  describe('#maxPage', () => {
    describe('with valid or omitted values', () => {
      [
        { description: 'when max_page is omitted', attrs: {}, expected: null },
        { description: 'when max_page is null', attrs: { maxPage: null }, expected: null },
        { description: 'when max_page is 0', attrs: { maxPage: 0 }, expected: null },
        { description: 'when max_page is a positive integer', attrs: { maxPage: 3 }, expected: 3 },
        { description: 'when max_page is 1', attrs: { maxPage: 1 }, expected: 1 },
      ].forEach(({ description, attrs, expected }) => {
        it(`returns ${expected} ${description}`, () => {
          LoggerUtils.stubLoggerMethods();
          expect(ResourceRequestFactory.build(attrs).maxPage).toBe(expected);
          expect(LogRegistry.warn).not.toHaveBeenCalled();
        });
      });
    });

    describe('with invalid values', () => {
      [
        { description: 'a negative integer', value: -1 },
        { description: 'a non-integer float', value: 1.5 },
        { description: 'NaN', value: NaN },
        { description: 'a numeric string', value: '3' },
        { description: 'a boolean', value: true },
        { description: 'an object', value: { page: 3 } },
        { description: 'an array', value: [3] },
      ].forEach(({ description, value }) => {
        it(`returns null and logs a warning when max_page is ${description}`, () => {
          LoggerUtils.stubLoggerMethods();
          expect(ResourceRequestFactory.build({ maxPage: value }).maxPage).toBeNull();
          expect(LogRegistry.warn).toHaveBeenCalledTimes(1);
        });
      });
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
