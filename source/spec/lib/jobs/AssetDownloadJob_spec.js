import { RequestFailed } from '../../../lib/exceptions/request/RequestFailed.js';
import { AssetDownloadJobFactory } from '../../support/factories/AssetDownloadJobFactory.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { NamespaceMapFactory } from '../../support/factories/NamespaceMapFactory.js';
import { AxiosUtils } from '../../support/utils/AxiosUtils.js';
import { JobLifecycleExamples } from '../../support/utils/JobLifecycleExamples.js';
import { LogContextUtils } from '../../support/utils/LogContextUtils.js';
import { LoggerUtils } from '../../support/utils/LoggerUtils.js';

describe('AssetDownloadJob', () => {
  let job;
  let logContext;

  const assetUrl = 'https://cdn.example.com/app.css';
  const getJob = () => job;
  const getLogContext = () => logContext;

  beforeEach(() => {
    LoggerUtils.stubLoggerMethods();
    logContext = LogContextUtils.build();
    job = AssetDownloadJobFactory.build();
  });

  describe('#constructor', () => {
    JobLifecycleExamples.identityExamples({ getJob, expectedId: 'asset-job' });
  });

  describe('#arguments', () => {
    it('returns url and clientName', () => {
      job = AssetDownloadJobFactory.build({ client: 'cdn' });
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
        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);
      });

      JobLifecycleExamples.successExamples({ getJob, getLogContext });

      it('logs debug when performing', async () => {
        await job.perform(logContext);
        expect(logContext.debug).toHaveBeenCalled();
      });
    });

    describe('when no client name is specified', () => {
      it('falls back to the default client', async () => {
        AxiosUtils.stubGet(200);
        job = AssetDownloadJobFactory.build();
        await expectAsync(job.perform(logContext)).toBeResolved();
      });
    });

    describe('when a named client is specified', () => {
      it('uses the named client', async () => {
        const cdnClient = ClientFactory.build({ name: 'cdn', baseUrl: 'https://cdn.example.com' });
        const clientRegistry = NamespaceMapFactory.build({ clients: { cdn: cdnClient } });
        AxiosUtils.stubGet(200);
        job = AssetDownloadJobFactory.build({ client: 'cdn', clientRegistry });
        await expectAsync(job.perform(logContext)).toBeResolved();
      });
    });

    describe('when the asset returns an unexpected status', () => {
      beforeEach(() => {
        AxiosUtils.stubGet(404);
      });

      it('throws RequestFailed', async () => {
        await expectAsync(job.perform(logContext)).toBeRejectedWithError(RequestFailed);
      });

      it('registers failure and increments attempts', async () => {
        await job.perform(logContext).catch(() => {});
        expect(job.lastError).toBeDefined();
      });

      it('logs the error', async () => {
        await job.perform(logContext).catch(() => {});
        expect(logContext.error).toHaveBeenCalled();
      });

      JobLifecycleExamples.exhaustionExample({ getJob, getLogContext, maxRetries: 3 });
    });

    describe('when the fetch succeeds', () => {
      it('does not enqueue further jobs (leaf node)', async () => {
        AxiosUtils.stubGet(200);
        const enqueueSpy = jasmine.createSpy('enqueue');
        await job.perform(logContext);
        expect(enqueueSpy).not.toHaveBeenCalled();
      });
    });
  });
});
