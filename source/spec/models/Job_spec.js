import axios from 'axios';
import { RequestFailed } from '../../lib/exceptions/RequestFailed.js';
import { Job } from '../../lib/models/Job.js';
import { Logger } from '../../lib/utils/Logger.js';
import { ClientFactory } from '../support/factories/ClientFactory.js';
import { ClientRegistryFactory } from '../support/factories/ClientRegistryFactory.js';
import { ResourceRequestFactory } from '../support/factories/ResourceRequestFactory.js';


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
    resourceRequest = ResourceRequestFactory.build({ url, status });
    client = ClientFactory.build({ baseUrl });
    clients = ClientRegistryFactory.build({ default: client });
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
        spyOn(Logger, 'info').and.stub();
      });

      it('performs the job', async () => {
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toBeUndefined();
        await expectAsync(job.perform()).toBeResolvedTo(response);
        expect(axios.get).toHaveBeenCalledWith(fullUrl, { timeout: undefined });
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toBeUndefined();
      });

      it('logs info when performing', async () => {
        await expectAsync(job.perform()).toBeResolvedTo(response);
        expect(Logger.info).toHaveBeenCalledWith(`Job #${job.id} performing`);
      });

      it('does not exhaust after several attempts', async () => {
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toBeUndefined();
        await expectAsync(job.perform()).toBeResolvedTo(response);
        await expectAsync(job.perform()).toBeResolvedTo(response);
        await expectAsync(job.perform()).toBeResolvedTo(response);
        expect(axios.get).toHaveBeenCalledWith(fullUrl, { timeout: undefined });
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
        spyOn(Logger, 'error').and.stub();
        spyOn(Logger, 'info').and.stub();
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

      it('logs the error', async () => {
        await job.perform().catch(() => {});
        expect(Logger.error).toHaveBeenCalledWith(`Job #${job.id} failed: ${expectedError}`);
      });
    });
  });

  describe('#isReady', () => {
    describe('when readyBy is 0 (default)', () => {
      it('returns true', () => {
        expect(job.isReady()).toBeTrue();
      });
    });

    describe('when readyBy is in the past', () => {
      beforeEach(() => {
        job.readyBy = Date.now() - 1000;
      });

      it('returns true', () => {
        expect(job.isReady()).toBeTrue();
      });
    });

    describe('when readyBy is in the future', () => {
      beforeEach(() => {
        job.readyBy = Date.now() + 10_000;
      });

      it('returns false', () => {
        expect(job.isReady()).toBeFalse();
      });
    });
  });

  describe('#exhausted', () => {
    beforeEach(async () => {
      spyOn(Logger, 'error').and.stub();
      spyOn(Logger, 'info').and.stub();
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
