import axios from 'axios';
import { Job } from '../../lib/models/Job.js';
import { ResourceRequest } from '../../lib/models/ResourceRequest.js';
import { ClientRegistry } from '../../lib/registry/ClientRegistry.js';
import { Client } from '../../lib/services/Client.js';


describe('Job', () => {
  let resourceRequest;
  let clients;
  let parameters;
  let job;
  let client;

  const baseUrl = 'http://example.com';
  const url = '/categories.json';
  const fullUrl = 'http://example.com/categories.json';
  const status = 200;

  let response;

  beforeEach(() => {
    resourceRequest = new ResourceRequest({ url, status });
    client = new Client({ name: 'default', baseUrl });
    clients = new ClientRegistry({ default: client });
    parameters = {};

    job = new Job({ id: 'id', resourceRequest, clients, parameters });
  });

  describe('#constructor', () => {
    it('stores the id', () => {
      expect(job.id).toEqual('id');
    });
  });

  describe('#process', () => {
    beforeEach(() => {
      response = { status: 200 };
      const promise = Promise.resolve(response);

      spyOn(axios, 'get').and.returnValue(promise);
    });

    it('performs the job', async () => {
      await expectAsync(job.perform()).toBeResolvedTo(response);
      expect(axios.get).toHaveBeenCalledWith(fullUrl);
    });
  });
});
