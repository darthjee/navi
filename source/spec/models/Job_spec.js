import axios from 'axios';
import { RequestFailed } from '../../lib/exceptions/RequestFailed.js';
import { Job } from '../../lib/models/Job.js';
import { ResourceRequest } from '../../lib/models/ResourceRequest.js';
import { ClientRegistry } from '../../lib/registry/ClientRegistry.js';
import { Client } from '../../lib/services/Client.js';


describe('Job', () => {
  let resourceRequest;
  let clients;
  let client;
  let parameters;
  let job;

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
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toBeUndefined();
        await expectAsync(job.perform()).toBeResolvedTo(response);
        expect(axios.get).toHaveBeenCalledWith(fullUrl);
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toBeUndefined();
      });

      it('increments attempts and sets lastError on failure', async () => {
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toBeUndefined();
        await expectAsync(job.perform()).toBeResolvedTo(response);
        expect(axios.get).toHaveBeenCalledWith(fullUrl);
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toBeUndefined();
      });
    });

    describe('when the client request fails', () => {
      beforeEach(() => {
        response = { status: 502 };
        const promise = Promise.resolve(response);

        expectedError = new RequestFailed(502, fullUrl);

        spyOn(axios, 'get').and.returnValue(promise);
      });

      it('register failure and attempt', async () => {
        expect(job.lastError).toBeUndefined();
        await job.perform().catch(() => {});
        await job.perform().catch(() => {});
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toEqual(expectedError);
        await job.perform().catch(() => {});
        expect(job.exhausted()).toBeTrue();
        expect(job.lastError).toEqual(expectedError);
      });
    });
  });

  describe('#exhausted', () => {
    beforeEach(async () => {
      await job.perform().catch(() => {});
      await job.perform().catch(() => {});
    });

    it('returns false if attempts are less than 3', () => {
      expect(job.exhausted()).toBeFalse();
    });

    it('returns true if attempts are 3 or more', async () => {
      await job.perform().catch(() => {});
      expect(job.exhausted()).toBeTrue();

      await job.perform().catch(() => {});
      expect(job.exhausted()).toBeTrue();
    });
  });
});
