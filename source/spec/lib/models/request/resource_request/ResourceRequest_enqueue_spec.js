import { JobRegistry } from 'deku-swarm';
import { ResourceRequest } from '../../../../../lib/models/request/resource_request/ResourceRequest.js';
import { Application } from '../../../../../lib/services/application/Application.js';
import { AssetRequestFactory } from '../../../../support/factories/AssetRequestFactory.js';
import { ClientRegistryFactory } from '../../../../support/factories/ClientRegistryFactory.js';
import { ResourceRequestActionFactory } from '../../../../support/factories/ResourceRequestActionFactory.js';
import { ResourceRequestFactory } from '../../../../support/factories/ResourceRequestFactory.js';
import { LoggerUtils } from '../../../../support/utils/LoggerUtils.js';
import { ResourceRequestSpecUtils } from '../../../../support/utils/ResourceRequestSpecUtils.js';

describe('ResourceRequest', () => {
  describe('#enqueueActions', () => {
    ResourceRequestSpecUtils.setupJobRegistrySpy();

    let action;
    let request;

    beforeEach(() => {
      action = ResourceRequestActionFactory.build({ resource: 'products' });
    });

    it('returns without errors when there are no actions', () => {
      request = ResourceRequestFactory.build();
      expect(() => request.enqueueActions(ResourceRequestSpecUtils.buildResponseWrapper('not valid json'))).not.toThrow();
    });

    it('does not enqueue anything when there are no actions', () => {
      request = ResourceRequestFactory.build();
      request.enqueueActions(ResourceRequestSpecUtils.buildResponseWrapper('[]'));
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
        request.enqueueActions(ResourceRequestSpecUtils.buildResponseWrapper(body));
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

  describe('#hasParser', () => {
    it('returns false when no parser is configured', () => {
      expect(ResourceRequestFactory.build().hasParser()).toBeFalse();
    });

    it('returns true when a parser is configured', () => {
      const request = new ResourceRequest({
        url: '/',
        status: 200,
        parser: { type: 'regex', match: '\\d+', field: 'value' },
      });

      expect(request.hasParser()).toBeTrue();
    });
  });

  describe('#hasEmit', () => {
    it('returns false when no emit is configured', () => {
      expect(ResourceRequestFactory.build().hasEmit()).toBeFalse();
    });

    it('returns true when an emit is configured and effectively enabled (no enabled/disabled given)', () => {
      const request = new ResourceRequest({
        url: '/',
        status: 200,
        emit: { method: 'POST', url: 'https://example.com/items' },
      });

      expect(request.hasEmit()).toBeTrue();
    });

    it('returns true when an emit is configured with enabled: true', () => {
      const request = new ResourceRequest({
        url: '/',
        status: 200,
        emit: { method: 'POST', url: 'https://example.com/items', enabled: true },
      });

      expect(request.hasEmit()).toBeTrue();
    });

    it('returns false when an emit is configured with disabled: true', () => {
      const request = new ResourceRequest({
        url: '/',
        status: 200,
        emit: { method: 'POST', url: 'https://example.com/items', disabled: true },
      });

      expect(request.hasEmit()).toBeFalse();
    });

    it('returns false when an emit is configured with enabled: false', () => {
      const request = new ResourceRequest({
        url: '/',
        status: 200,
        emit: { method: 'POST', url: 'https://example.com/items', enabled: false },
      });

      expect(request.hasEmit()).toBeFalse();
    });
  });
});
