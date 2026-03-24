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
  let expectedError;

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
    describe('when the client request is successful', () => {
      beforeEach(() => {
        response = { status: 200 };
        const promise = Promise.resolve(response);

        spyOn(axios, 'get').and.returnValue(promise);
      });

      it('performs the job', async () => {
        expect(job.attempts).toEqual(0);
        await expectAsync(job.perform()).toBeResolvedTo(response);
        expect(axios.get).toHaveBeenCalledWith(fullUrl);
        expect(job.attempts).toEqual(1);
      });
    });

    describe('when the client request fails', () => {
      beforeEach(() => {
        response = { status: 502 };
        const promise = Promise.resolve(response);

        expectedError = jasmine.objectContaining({
          name: 'RequestFailed',
          statusCode: 502,
          url: fullUrl,
        });

        spyOn(axios, 'get').and.returnValue(promise);
      });

      it('performs the job', async () => {
        expect(job.attempts).toEqual(0);
        await expectAsync(job.perform()).toBeRejectedWith(expectedError);
        expect(axios.get).toHaveBeenCalledWith(fullUrl);
        expect(job.attempts).toEqual(1);
      });
    });
  });
});
