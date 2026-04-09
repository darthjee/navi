import axios from 'axios';
import { RequestFailed } from '../../../lib/exceptions/RequestFailed.js';
import { JobFactory } from '../../../lib/factories/JobFactory.js';
import { Job } from '../../../lib/models/Job.js';
import { ResourceRequestJob } from '../../../lib/models/ResourceRequestJob.js';
import { Worker } from '../../../lib/models/Worker.js';
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/registry/WorkersRegistry.js';
import { IdentifyableCollection } from '../../../lib/utils/collections/IdentifyableCollection.js';
import { Queue } from '../../../lib/utils/collections/Queue.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { ClientRegistryFactory } from '../../support/factories/ClientRegistryFactory.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';

describe('Worker', () => {
  let jobRegistry;
  let workerRegistry;
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
    clients = ClientRegistryFactory.build({});
    JobFactory.registry('ResourceRequestJob', new JobFactory({ attributes: { clients } }));
    finished = new IdentifyableCollection();
    failed = new Queue();
    jobRegistry = new JobRegistry({ failed, finished });

    idle = new IdentifyableCollection();
    workerRegistry = new WorkersRegistry({ quantity: 0, idle, jobRegistry });

    worker = new Worker({ id: 1, jobRegistry, workerRegistry });
  });

  afterEach(() => {
    JobFactory.reset();
  });

  describe('#constructor', () => {
    it('stores the id', () => {
      expect(worker.id).toEqual(1);
    });

    it('stores the job registry', () => {
      expect(worker.jobRegistry).toEqual(jobRegistry);
    });

    it('stores the worker registry', () => {
      expect(worker.workerRegistry).toEqual(workerRegistry);
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

      job = new ResourceRequestJob({ id: 'id', resourceRequest, clients, parameters });
      worker.assign(job);

      spyOn(console, 'error').and.stub();
    });

    describe('when no job is assigned', () => {
      it('throws an error', async () => {
        const unassignedWorker = new Worker({ id: 2, jobRegistry, workerRegistry });
        expectedError = new Error('No job assigned to worker');
        await expectAsync(unassignedWorker.perform()).toBeRejectedWith(expectedError);
      });
    });

    describe('when the client request is successful', () => {
      beforeEach(() => {
        response = { status: 200, data: '[]' };
        const promise = Promise.resolve(response);

        spyOn(axios, 'get').and.returnValue(promise);
        spyOn(resourceRequest, 'executeActions').and.stub();
      });

      it('performs the job', async () => {
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toBeUndefined();
        await worker.perform();
        expect(axios.get).toHaveBeenCalledWith(fullUrl, { timeout: 5000, responseType: 'text' });
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toBeUndefined();
        expect(console.error).not.toHaveBeenCalled();
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
        expect(axios.get).toHaveBeenCalledWith(fullUrl, { timeout: 5000, responseType: 'text' });
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toEqual(expectedError);
        expect(console.error).toHaveBeenCalledWith(`Error occurred while performing job: #${job.id} - ${expectedError}`);
      });

      it ('fails the job', async () => {
        expect(failed.hasItem()).toBeFalse();
        await worker.perform();
        expect(failed.hasItem()).toBeTrue();
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
