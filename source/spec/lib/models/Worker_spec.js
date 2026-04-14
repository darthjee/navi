import axios from 'axios';
import { RequestFailed } from '../../../lib/exceptions/RequestFailed.js';
import { JobFactory } from '../../../lib/factories/JobFactory.js';
import { Job } from '../../../lib/models/Job.js';
import { Worker } from '../../../lib/models/Worker.js';
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/registry/WorkersRegistry.js';
import { IdentifyableCollection } from '../../../lib/utils/collections/IdentifyableCollection.js';
import { Queue } from '../../../lib/utils/collections/Queue.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { ClientRegistryFactory } from '../../support/factories/ClientRegistryFactory.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';
import { ResourceRequestJobFactory } from '../../support/factories/ResourceRequestJobFactory.js';
import { LoggerUtils } from '../../support/utils/LoggerUtils.js';

describe('Worker', () => {
  let worker;
  let clients;
  let finished;
  let failed;

  let resourceRequest;
  let client;
  let parameters;
  let job;
  let response;
  let expectedError;

  let idle;

  const baseUrl = 'http://example.com';
  const url = '/categories.json';
  const fullUrl = 'http://example.com/categories.json';
  const status = 200;

  beforeEach(() => {
    LoggerUtils.stubLoggerMethods();
    clients = ClientRegistryFactory.build({});
    JobFactory.build('ResourceRequestJob', { attributes: { clients } });
    finished = new IdentifyableCollection();
    failed = new Queue();
    JobRegistry.build({ failed, finished });

    idle = new IdentifyableCollection();
    WorkersRegistry.build({ quantity: 0, idle });

    worker = new Worker({ id: 1, jobRegistry: JobRegistry, workersRegistry: WorkersRegistry });
  });

  afterEach(() => {
    JobRegistry.reset();
    JobFactory.reset();
    WorkersRegistry.reset();
  });

  describe('#constructor', () => {
    it('stores the id', () => {
      expect(worker.id).toEqual(1);
    });
  });

  describe('#assign', () => {
    it('assigns a job to the worker', () => {
      const job = new Job({ payload: { value: 1 } });
      worker.assign(job);
      expect(worker.job).toEqual(job);
    });
  });


  describe('#process', () => {
    beforeEach(() => {
      resourceRequest = ResourceRequestFactory.build({ url, status });
      client = ClientFactory.build({ baseUrl });
      clients = ClientRegistryFactory.build({ default: client });
      parameters = {};

      job = ResourceRequestJobFactory.build({ resourceRequest, clients, parameters });
      worker.assign(job);

    });

    describe('when no job is assigned', () => {
      it('throws an error', async () => {
        const unassignedWorker = new Worker({ id: 2, jobRegistry: JobRegistry, workersRegistry: WorkersRegistry });
        expectedError = new Error('No job assigned to worker');
        await expectAsync(unassignedWorker.perform()).toBeRejectedWith(expectedError);
      });
    });

    describe('when the client request is successful', () => {
      beforeEach(() => {
        response = { status: 200, data: '[]' };
        const promise = Promise.resolve(response);

        spyOn(axios, 'get').and.returnValue(promise);
      });

      it('performs the job', async () => {
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toBeUndefined();
        await worker.perform();
        expect(axios.get).toHaveBeenCalledWith(fullUrl, { timeout: 5000, responseType: 'text', headers: {} });
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toBeUndefined();
        expect(Logger.error).not.toHaveBeenCalled();
      });

      it('finishes the job', async () => {
        expect(finished.has(job.id)).toBeFalse();
        await worker.perform();
        expect(finished.has(job.id)).toBeTrue();
      });

      it('unassigns the job after finishing', async () => {
        expect(worker.job).toEqual(job);
        await worker.perform();
        expect(worker.job).toBeUndefined();
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
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toBeUndefined();
        await worker.perform();
        expect(axios.get).toHaveBeenCalledWith(fullUrl, { timeout: 5000, responseType: 'text', headers: {} });
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toEqual(expectedError);
        expect(Logger.error).toHaveBeenCalledWith(jasmine.stringContaining(job.id));
      });

      it ('fails the job', async () => {
        expect(failed.hasAny()).toBeFalse();
        await worker.perform();
        expect(failed.hasAny()).toBeTrue();
        expect(failed.pick()).toEqual(job);
      });

      it('unassigns the job after finishing', async () => {
        expect(worker.job).toEqual(job);
        await worker.perform();
        expect(worker.job).toBeUndefined();
      });
    });
  });
});
