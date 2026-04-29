import { AssetRequest } from '../../../lib/models/AssetRequest.js';
import { ResourceRequest } from '../../../lib/models/ResourceRequest.js';
import { ResponseWrapper } from '../../../lib/models/ResponseWrapper.js';
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { Application } from '../../../lib/services/Application.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { AssetRequestFactory } from '../../support/factories/AssetRequestFactory.js';
import { ClientRegistryFactory } from '../../support/factories/ClientRegistryFactory.js';
import { ResourceRequestActionFactory } from '../../support/factories/ResourceRequestActionFactory.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';

describe('ResourceRequest', () => {
  describe('.fromList', () => {
    it('returns a list of ResourceRequest instances with mapped attributes', () => {
      const resources = [
        { url: '/categories.json', status: 200 },
        { url: '/categories.html', status: 302 },
      ];

      const resourceRequests = ResourceRequest.fromList(resources);

      expect(resourceRequests).toEqual([
        ResourceRequestFactory.build(),
        ResourceRequestFactory.build({ url: '/categories.html', status: 302 }),
      ]);
      expect(resourceRequests.every((resourceRequest) => resourceRequest instanceof ResourceRequest)).toBeTrue();
    });

    it('assigns the given clientName to each ResourceRequest', () => {
      const resources = [
        { url: '/categories.json', status: 200 },
        { url: '/categories.html', status: 302 },
      ];

      const resourceRequests = ResourceRequest.fromList(resources, { clientName: 'myClient' });

      expect(resourceRequests.every((rr) => rr.clientName === 'myClient')).toBeTrue();
    });

    it('passes actions through to each ResourceRequest', () => {
      const resources = [
        { url: '/categories.json', status: 200, actions: [{ resource: 'products' }] },
      ];

      const resourceRequests = ResourceRequest.fromList(resources);

      expect(resourceRequests[0].actions.length).toBe(1);
    });
  });

  describe('#clientName', () => {
    it('returns undefined when no clientName is set', () => {
      const request = ResourceRequestFactory.build();
      expect(request.clientName).toBeUndefined();
    });

    it('returns the clientName when set', () => {
      const request = ResourceRequestFactory.build({ clientName: 'myClient' });
      expect(request.clientName).toBe('myClient');
    });
  });

  describe('#resolveUrl', () => {
    it('returns the URL unchanged when there are no placeholders and no parameters', () => {
      const request = ResourceRequestFactory.build({ url: '/categories.json' });
      expect(request.resolveUrl({})).toEqual('/categories.json');
    });

    it('replaces a single placeholder with the matching parameter', () => {
      const request = ResourceRequestFactory.build({ url: '/categories/{:id}.json' });
      expect(request.resolveUrl({ id: 1 })).toEqual('/categories/1.json');
    });

    it('replaces multiple placeholders with matching parameters', () => {
      const request = ResourceRequestFactory.build({ url: '/categories/{:cat}/items/{:item}' });
      expect(request.resolveUrl({ cat: 5, item: 3 })).toEqual('/categories/5/items/3');
    });

    it('leaves placeholders unchanged when no matching key exists', () => {
      const request = ResourceRequestFactory.build({ url: '/categories/{:id}.json' });
      expect(request.resolveUrl({})).toEqual('/categories/{:id}.json');
    });

    it('returns the URL unchanged when there are no placeholders but extra parameters', () => {
      const request = ResourceRequestFactory.build({ url: '/categories.json' });
      expect(request.resolveUrl({ id: 1 })).toEqual('/categories.json');
    });

    it('returns the URL unchanged when called with no arguments', () => {
      const request = ResourceRequestFactory.build({ url: '/categories/{:id}.json' });
      expect(request.resolveUrl()).toEqual('/categories/{:id}.json');
    });
  });

  describe('#needsParams', () => {
    it('returns false when the URL has no placeholders', () => {
      const request = ResourceRequestFactory.build();
      expect(request.needsParams()).toBeFalse();
    });

    it('returns true when the URL has one placeholder', () => {
      const request = ResourceRequestFactory.build({ url: '/categories/{:id}.json' });
      expect(request.needsParams()).toBeTrue();
    });

    it('returns true when the URL has multiple placeholders', () => {
      const request = ResourceRequestFactory.build({ url: '/categories/{:id}/items/{:item_id}' });
      expect(request.needsParams()).toBeTrue();
    });

    it('returns false for an empty URL', () => {
      const request = ResourceRequestFactory.build({ url: '' });
      expect(request.needsParams()).toBeFalse();
    });

    it('returns false for a malformed placeholder without the colon prefix', () => {
      const request = ResourceRequestFactory.build({ url: '/categories/{id}.json' });
      expect(request.needsParams()).toBeFalse();
    });
  });

  describe('#enqueueActions', () => {
    let action;
    let request;

    beforeEach(() => {
      spyOn(Logger, 'info').and.stub();
      spyOn(Logger, 'error').and.stub();
      action = ResourceRequestActionFactory.build({ resource: 'products' });
      JobRegistry.build({ cooldown: -1 });
      spyOn(JobRegistry, 'enqueue').and.stub();
    });

    afterEach(() => {
      JobRegistry.reset();
    });

    describe('when there are no actions', () => {
      it('returns immediately without errors', () => {
        request = ResourceRequestFactory.build();
        const wrapper = new ResponseWrapper({ data: 'not valid json', headers: {} });
        expect(() => request.enqueueActions(wrapper)).not.toThrow();
      });

      it('does not call enqueue', () => {
        request = ResourceRequestFactory.build();
        const wrapper = new ResponseWrapper({ data: '[]', headers: {} });
        request.enqueueActions(wrapper);
        expect(JobRegistry.enqueue).not.toHaveBeenCalled();
      });
    });

    describe('when the response is a JSON array', () => {
      beforeEach(() => {
        request = ResourceRequestFactory.build({ actions: [{ resource: 'products' }] });
        request.actions = [action];
      });

      it('calls enqueue once per element', () => {
        const wrapper = new ResponseWrapper({ data: '[{"id":1},{"id":2}]', headers: {} });
        request.enqueueActions(wrapper);
        expect(JobRegistry.enqueue).toHaveBeenCalledTimes(2);
      });
    });

    describe('when the response is a JSON object', () => {
      beforeEach(() => {
        request = ResourceRequestFactory.build({ actions: [{ resource: 'products' }] });
        request.actions = [action];
      });

      it('calls enqueue once with the item', () => {
        const wrapper = new ResponseWrapper({ data: '{"id":1}', headers: {} });
        request.enqueueActions(wrapper);
        expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith(
          'Action',
          jasmine.objectContaining({ action })
        );
      });
    });
  });

  describe('#hasAssets', () => {
    it('returns false when the assets list is empty', () => {
      const request = ResourceRequestFactory.build();
      expect(request.hasAssets()).toBeFalse();
    });

    it('returns true when the assets list is non-empty', () => {
      const assetAttrs = [{ selector: 'link[rel="stylesheet"]', attribute: 'href' }];
      const request = new ResourceRequest({ url: '/', status: 200, assets: assetAttrs });
      expect(request.hasAssets()).toBeTrue();
    });
  });

  describe('.fromList with assets', () => {
    it('parses the assets list into AssetRequest instances', () => {
      const resources = [
        { url: '/', status: 200, assets: [{ selector: 'link[rel="stylesheet"]', attribute: 'href' }] },
      ];

      const [request] = ResourceRequest.fromList(resources);

      expect(request.assets.length).toBe(1);
      expect(request.assets[0]).toBeInstanceOf(AssetRequest);
    });

    it('sets an empty assets array when the key is absent', () => {
      const resources = [{ url: '/', status: 200 }];
      const [request] = ResourceRequest.fromList(resources);

      expect(request.assets).toEqual([]);
      expect(request.hasAssets()).toBeFalse();
    });
  });

  describe('#enqueueAssets', () => {
    let request;
    let jobRegistry;
    let clientRegistry;

    beforeEach(() => {
      spyOn(Logger, 'info').and.stub();
      spyOn(Logger, 'error').and.stub();
      jobRegistry = jasmine.createSpyObj('jobRegistry', ['enqueue']);
      clientRegistry = ClientRegistryFactory.build();
      const assetAttrs = [{ selector: 'link[rel="stylesheet"]', attribute: 'href' }];
      request = new ResourceRequest({ url: '/', status: 200, assets: assetAttrs });
    });

    it('enqueues one HtmlParseJob with the correct rawHtml and assetRequests', () => {
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
      request = new ResourceRequest({ url: '/', status: 200, assets: [] });
      request.assets = [assetRequest];
      request.enqueueAssets('<html></html>', jobRegistry, clientRegistry);

      expect(jobRegistry.enqueue).toHaveBeenCalledWith('HtmlParse',
        jasmine.objectContaining({ assetRequests: [assetRequest] })
      );
    });

    describe('when the application is not running', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('paused');
      });

      it('does not enqueue any job', () => {
        request.enqueueAssets('<html></html>', jobRegistry, clientRegistry);
        expect(jobRegistry.enqueue).not.toHaveBeenCalled();
      });
    });
  });

});
