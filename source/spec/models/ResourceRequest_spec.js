import { ResourceRequest } from '../../lib/models/ResourceRequest.js';

describe('ResourceRequest', () => {
  describe('.fromList', () => {
    it('returns a list of ResourceRequest instances with mapped attributes', () => {
      const resources = [
        { url: '/categories.json', status: 200 },
        { url: '/categories.html', status: 302 },
      ];

      const resourceRequests = ResourceRequest.fromList(resources);

      expect(resourceRequests).toEqual([
        new ResourceRequest({ url: '/categories.json', status: 200 }),
        new ResourceRequest({ url: '/categories.html', status: 302 }),
      ]);
      expect(resourceRequests.every((resourceRequest) => resourceRequest instanceof ResourceRequest)).toBeTrue();
    });
  });
});
