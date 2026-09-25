import axios from 'axios';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { NamespaceMapFactory } from '../../support/factories/NamespaceMapFactory.js';
import { ResourceRequestJobSpecUtils } from '../../support/utils/ResourceRequestJobSpecUtils.js';

const { url } = ResourceRequestJobSpecUtils;

describe('ResourceRequestJob', () => {
  const ctx = ResourceRequestJobSpecUtils.setup();

  describe('#perform', () => {
    describe('when the resource request has assets', () => {
      const rawHtml = '<html><head><link rel="stylesheet" href="/a.css"></head></html>';

      beforeEach(() => {
        ctx.prepareHook({
          predicate: 'hasAssets', returnValue: true, enqueueMethod: 'enqueueAssets', body: rawHtml,
        });
      });

      it('calls enqueueAssets with the raw response body and originUrl', async () => {
        await ctx.job.perform(ctx.logContext);

        expect(ctx.resourceRequest.enqueueAssets).toHaveBeenCalledOnceWith(
          rawHtml,
          jasmine.anything(),
          jasmine.anything(),
          url,
        );
      });

      it('still calls enqueueActions after enqueueing assets', async () => {
        await ctx.job.perform(ctx.logContext);

        expect(ctx.resourceRequest.enqueueAssets).toHaveBeenCalledTimes(1);
        expect(ctx.resourceRequest.enqueueActions).toHaveBeenCalledTimes(1);
      });
    });

    describe('when the resource request has a parser', () => {
      const rawBody = '{"value":42}';

      beforeEach(() => {
        ctx.prepareHook({
          predicate: 'hasParser', returnValue: true, enqueueMethod: 'enqueueExtraction', body: rawBody,
        });
      });

      it('calls enqueueExtraction with the raw response body, parameters and originUrl', async () => {
        await ctx.job.perform(ctx.logContext);

        expect(ctx.resourceRequest.enqueueExtraction).toHaveBeenCalledOnceWith(
          rawBody,
          jasmine.anything(),
          ctx.parameters,
          url,
        );
      });

      it('still calls enqueueActions after enqueueing extraction', async () => {
        await ctx.job.perform(ctx.logContext);

        expect(ctx.resourceRequest.enqueueExtraction).toHaveBeenCalledTimes(1);
        expect(ctx.resourceRequest.enqueueActions).toHaveBeenCalledTimes(1);
      });
    });

    describe('when the resource request has no parser', () => {
      beforeEach(() => {
        ctx.prepareHook({ predicate: 'hasParser', returnValue: false, enqueueMethod: 'enqueueExtraction' });
      });

      it('does not call enqueueExtraction', async () => {
        await ctx.job.perform(ctx.logContext);

        expect(ctx.resourceRequest.enqueueExtraction).not.toHaveBeenCalled();
      });
    });

    describe('namespace-aware client resolution', () => {
      let otherClient;

      beforeEach(() => {
        otherClient = ClientFactory.build({ name: 'other', baseUrl: 'http://other.example.com' });
        ctx.rebuildJob({
          clients: NamespaceMapFactory.build({ namespace: 'paginated', clients: { other: otherClient } }),
          resourceRequestAttributes: {
            clientName: { name: 'other', namespace: 'paginated' },
            namespace: 'default',
          },
        });
        ctx.stubEnqueueMethods();
      });

      it('resolves the client from the explicit target namespace', async () => {
        ctx.stubGet();

        await ctx.performAndExpectResponse();

        expect(axios.get).toHaveBeenCalledWith(
          'http://other.example.com/categories.json',
          ResourceRequestJobSpecUtils.expectedRequestOptions,
        );
      });
    });
  });
});
