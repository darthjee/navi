import { RequestFailed } from '../../../lib/exceptions/RequestFailed.js';
import { AssetDownloadJob } from '../../../lib/models/AssetDownloadJob.js';
import { Job } from '../../../lib/models/Job.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { ClientRegistryFactory } from '../../support/factories/ClientRegistryFactory.js';
import { AxiosUtils } from '../../support/utils/AxiosUtils.js';
import { LoggerUtils } from '../../support/utils/LoggerUtils.js';

describe('AssetDownloadJob', () => {
  let job;
  let clientRegistry;
  let client;

  const baseUrl = 'https://example.com';
  const assetUrl = 'https://cdn.example.com/app.css';

  beforeEach(() => {
    LoggerUtils.stubLoggerMethods();
    client = ClientFactory.build({ baseUrl });
    clientRegistry = ClientRegistryFactory.build({ default: client });
    job = new AssetDownloadJob({ id: 'asset-job', url: assetUrl, status: 200, clientRegistry });
  });

  describe('#constructor', () => {
    it('is an instance of Job', () => {
      expect(job).toBeInstanceOf(Job);
    });

    it('stores the id', () => {
      expect(job.id).toBe('asset-job');
    });
  });

  describe('#arguments', () => {
    it('returns url and clientName', () => {
      job = new AssetDownloadJob({ id: 'asset-job', url: assetUrl, client: 'cdn', status: 200, clientRegistry });
      expect(job.arguments).toEqual({ url: assetUrl, clientName: 'cdn' });
    });

    it('returns undefined clientName when no client is specified', () => {
      expect(job.arguments).toEqual({ url: assetUrl, clientName: undefined });
    });
  });

  describe('#perform', () => {
    describe('when the asset request is successful', () => {
      let response;

      beforeEach(() => {
        response = AxiosUtils.stubGet(200);
      });

      it('resolves with the response', async () => {
        await expectAsync(job.perform()).toBeResolvedTo(response);
      });

      it('clears lastError before performing', async () => {
        job.lastError = new Error('previous error');
        await job.perform();
        expect(job.lastError).toBeUndefined();
      });

      it('does not exhaust after a successful attempt', async () => {
        await job.perform();
        expect(job.exhausted()).toBeFalse();
      });

      it('logs debug when performing', async () => {
        await job.perform();
        expect(Logger.debug).toHaveBeenCalled();
      });
    });

    describe('when no client name is specified', () => {
      it('falls back to the default client', async () => {
        AxiosUtils.stubGet(200);
        job = new AssetDownloadJob({ id: 'asset-job', url: assetUrl, status: 200, clientRegistry });
        await expectAsync(job.perform()).toBeResolved();
      });
    });

    describe('when a named client is specified', () => {
      it('uses the named client', async () => {
        const cdnClient = ClientFactory.build({ name: 'cdn', baseUrl: 'https://cdn.example.com' });
        clientRegistry = ClientRegistryFactory.build({ cdn: cdnClient });
        AxiosUtils.stubGet(200);
        job = new AssetDownloadJob({ id: 'asset-job', url: assetUrl, client: 'cdn', status: 200, clientRegistry });
        await expectAsync(job.perform()).toBeResolved();
      });
    });

    describe('when the asset returns an unexpected status', () => {
      beforeEach(() => {
        AxiosUtils.stubGet(404);
      });

      it('throws RequestFailed', async () => {
        await expectAsync(job.perform()).toBeRejectedWithError(RequestFailed);
      });

      it('registers failure and increments attempts', async () => {
        await job.perform().catch(() => {});
        expect(job.lastError).toBeDefined();
      });

      it('logs the error', async () => {
        await job.perform().catch(() => {});
        expect(Logger.error).toHaveBeenCalled();
      });

      it('is exhausted after the configured max retries', async () => {
        await job.perform().catch(() => {});
        await job.perform().catch(() => {});
        expect(job.exhausted()).toBeFalse();
        await job.perform().catch(() => {});
        expect(job.exhausted()).toBeTrue();
      });
    });

    describe('when the fetch succeeds', () => {
      it('does not enqueue further jobs (leaf node)', async () => {
        AxiosUtils.stubGet(200);
        const enqueueSpy = jasmine.createSpy('enqueue');
        await job.perform();
        expect(enqueueSpy).not.toHaveBeenCalled();
      });
    });
  });
});
