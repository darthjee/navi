import { Resource } from '../../lib/models/Resource.js';
import { ResourceRequest } from '../../lib/models/ResourceRequest.js';

describe('Resource', () => {
  describe('.fromObject', () => {
    const name = 'categories';
    const resourceRequests = [
      { url: '/categories.json', status: 200 },
      { url: '/categories.html', status: 302 },
    ];

    it('returns a Resource instance', () => {
      const resource = Resource.fromObject({ name, resourceRequests });

      expect(resource instanceof Resource).toBeTrue();
    });

    it('maps request objects to ResourceRequest instances', () => {
      const resource = Resource.fromObject({ name, resourceRequests });

      expect(resource).toEqual(new Resource({
        name,
        resourceRequests: [
          new ResourceRequest({ url: '/categories.json', status: 200 }),
          new ResourceRequest({ url: '/categories.html', status: 302 }),
        ],
      }));
    });
  });
});
