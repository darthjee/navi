import { Job } from '../../lib/models/Job.js';
import { ResourceRequest } from '../../lib/models/ResourceRequest.js';
import { ClientRegistry } from '../../lib/registry/ClientRegistry.js';
import { Client } from '../../lib/services/Client.js';

describe('Job', () => {
  let resourceRequest;
  let clients;
  let parameters;
  let job;
  let clientsMap;
  let client;

  beforeEach(() => {
    resourceRequest = new ResourceRequest({ url: 'http://example.com', status: 200 });
    client = new Client({ name: 'default' });
    clientsMap = { default: client };
    clients = new ClientRegistry(clientsMap);
    parameters = {};
    job = new Job({ id: 'id', resourceRequest, clients, parameters });
  });

  describe('#constructor', () => {
    it('stores the id', () => {
      expect(job.id).toEqual('id');
    });
  });

  describe('#process', () => {
    xit('performs the job', () => {
      expect(job.perform()).toBeUndefined();
    });
  });
});
