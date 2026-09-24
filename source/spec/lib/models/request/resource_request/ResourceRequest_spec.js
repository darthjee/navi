import { AssetRequest } from '../../../../../lib/models/request/AssetRequest.js';
import { ResourceRequest } from '../../../../../lib/models/request/resource_request/ResourceRequest.js';
import { ResourceRequestEmit } from '../../../../../lib/models/request/resource_request/ResourceRequestEmit.js';
import { ResourceRequestParser } from '../../../../../lib/models/request/resource_request/ResourceRequestParser.js';
import { LogRegistry } from '../../../../../lib/registry/LogRegistry.js';
import { ResourceRequestFactory } from '../../../../support/factories/ResourceRequestFactory.js';
import { LoggerUtils } from '../../../../support/utils/LoggerUtils.js';

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

  describe('#parser and #emit', () => {
    it('leaves parser and emit undefined when both are absent', () => {
      const request = new ResourceRequest({ url: '/categories.json', status: 200 });

      expect(request.parser).toBeUndefined();
      expect(request.emit).toBeUndefined();
      expect(request.actions).toEqual([]);
      expect(request.assets).toEqual([]);
    });

    it('builds a ResourceRequestParser when parser is present and leaves emit undefined', () => {
      const request = new ResourceRequest({
        url: '/categories.json',
        status: 200,
        parser: { type: 'regex', match: '\\d+' },
      });

      expect(request.parser).toBeInstanceOf(ResourceRequestParser);
      expect(request.parser.type).toBe('regex');
      expect(request.emit).toBeUndefined();
    });

    it('builds a ResourceRequestEmit when emit is present and leaves parser undefined', () => {
      const request = new ResourceRequest({
        url: '/categories.json',
        status: 200,
        emit: { client: 'myClient', method: 'POST', url: '/emit' },
      });

      expect(request.emit).toBeInstanceOf(ResourceRequestEmit);
      expect(request.emit.clientName).toBe('myClient');
      expect(request.parser).toBeUndefined();
    });

    it('builds both parser and emit when present together, alongside actions/assets', () => {
      const request = new ResourceRequest({
        url: '/categories.json',
        status: 200,
        parser: { type: 'json_path', fields: { id: 'id' } },
        emit: { client: 'myClient', method: 'PUT', url: '/emit' },
        actions: [{ resource: 'products' }],
        assets: [{ selector: 'link[rel="stylesheet"]', attribute: 'href' }],
      });

      expect(request.parser).toBeInstanceOf(ResourceRequestParser);
      expect(request.emit).toBeInstanceOf(ResourceRequestEmit);
      expect(request.actions.length).toBe(1);
      expect(request.assets.length).toBe(1);
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
});
