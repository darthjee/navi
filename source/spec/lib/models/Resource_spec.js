import { Resource } from '../../../lib/models/Resource.js';
import { ResourceFactory } from '../../support/factories/ResourceFactory.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';

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

      expect(resource).toEqual(ResourceFactory.build({
        name,
        resourceRequests: [
          ResourceRequestFactory.build(),
          ResourceRequestFactory.build({ url: '/categories.html', status: 302 }),
        ],
      }));
    });

    it('propagates the client name to each ResourceRequest', () => {
      const resource = Resource.fromObject({ name, client: 'myClient', resourceRequests });

      expect(resource.client).toBe('myClient');
      expect(resource.resourceRequests.every((rr) => rr.clientName === 'myClient')).toBeTrue();
    });
  });

  describe('.fromListObject', () => {
    const resources = {
      categories: [
        { url: '/categories.json', status: 200 },
      ],
      category: [
        { url: '/categories/{:id}.json', status: 200 },
      ],
    };

    it('returns a list of Resource instances', () => {
      const mappedResources = Resource.fromListObject(resources);

      expect(Array.isArray(mappedResources)).toBeTrue();
      expect(mappedResources.every((resource) => resource instanceof Resource)).toBeTrue();
    });

    it('maps each object key and requests to Resource instances', () => {
      const mappedResources = Resource.fromListObject(resources);

      expect(mappedResources).toEqual([
        ResourceFactory.build(),
        ResourceFactory.build({
          name: 'category',
          resourceRequests: [
            ResourceRequestFactory.build({ url: '/categories/{:id}.json' }),
          ],
        }),
      ]);
    });
  });
});
