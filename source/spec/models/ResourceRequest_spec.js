import { ResourceRequest } from '../../lib/models/ResourceRequest.js';
import { ResourceRequestFactory } from '../support/factories/ResourceRequestFactory.js';

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
});
