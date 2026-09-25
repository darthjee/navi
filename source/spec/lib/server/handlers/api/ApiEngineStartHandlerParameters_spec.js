import { JobRegistry } from 'deku-swarm';
import { NamespaceMap } from '../../../../../lib/registry/namespace/NamespaceMap.js';
import { Application } from '../../../../../lib/services/application/Application.js';
import { ApiEngineStartHandlerSpecUtils } from '../../../../support/utils/ApiEngineStartHandlerSpecUtils.js';
import { ApplicationStateUtils } from '../../../../support/utils/ApplicationStateUtils.js';
import { NamespaceMapUtils } from '../../../../support/utils/NamespaceMapUtils.js';

describe('ApiEngineStartHandler', () => {
  const ctx = ApiEngineStartHandlerSpecUtils.setup();
  const { processBody, expectRunningResponse } = ctx;

  describe('#process with target parameters', () => {
    describe('when the engine is stopped', () => {
      beforeEach(() => {
        ApplicationStateUtils.stubStopped();
      });

      describe('and targets carries an object-form resource with parameters', () => {
        let collectionRequest;

        beforeEach(() => {
          ({ collection: collectionRequest } = NamespaceMapUtils.build({
            reports: { collection: '/bundle/{:slug}/' },
          }));

          spyOn(Application, 'start').and.returnValue(Promise.resolve(undefined));
        });

        it('enqueues the resource with the given parameters and responds with running status', async () => {
          await processBody({
            targets: [{ namespace: 'reports', resources: [{ name: 'collection', parameters: { slug: 'x' } }] }],
          });

          expect(JobRegistry.enqueue).toHaveBeenCalledWith(
            'ResourceRequestJob',
            { resourceRequest: collectionRequest, parameters: { slug: 'x' } },
          );
          expectRunningResponse(['collection']);
        });
      });
    });

    describe('when the engine is running', () => {
      beforeEach(() => {
        ApplicationStateUtils.stubRunning();
      });

      describe('and targets carries parameters', () => {
        let categoryRequest;

        beforeEach(() => {
          ({ categories: categoryRequest } = NamespaceMapUtils.build({
            reports: { categories: '/categories/{:id}.json' },
          }));
        });

        it('forwards an object-form resources[] entry parameters, merged shape, to ResourceEnqueuer', async () => {
          await processBody({
            targets: [{ namespace: 'reports', resources: [{ name: 'categories', parameters: { id: 1 } }] }],
          });

          expect(JobRegistry.enqueue).toHaveBeenCalledWith(
            'ResourceRequestJob',
            { resourceRequest: categoryRequest, parameters: { id: 1 } },
          );
          expectRunningResponse(['categories']);
        });

        it('forwards a target-level parameters default merged under a per-resource override', async () => {
          await processBody({
            targets: [{
              namespace: 'reports',
              parameters: { id: 1, extra: 'value' },
              resources: [{ name: 'categories', parameters: { id: 2 } }],
            }],
          });

          expect(JobRegistry.enqueue).toHaveBeenCalledWith(
            'ResourceRequestJob',
            { resourceRequest: categoryRequest, parameters: { id: 2, extra: 'value' } },
          );
        });

        it('applies a target-level parameters default to a bare-string resources[] entry', async () => {
          await processBody({
            targets: [{ namespace: 'reports', parameters: { id: 5 }, resources: ['categories'] }],
          });

          expect(JobRegistry.enqueue).toHaveBeenCalledWith(
            'ResourceRequestJob',
            { resourceRequest: categoryRequest, parameters: { id: 5 } },
          );
        });

        it('ignores unknown keys on a resource object entry rather than rejecting it', async () => {
          await processBody({
            targets: [{
              namespace: 'reports',
              resources: [{ name: 'categories', parameters: { id: 1 }, unknown: 'ignored' }],
            }],
          });

          expect(ctx.res.status).not.toHaveBeenCalled();
          expectRunningResponse(['categories']);
        });

        it('remains unaffected for a plain bare-string-only resources[] request with no parameters anywhere', async () => {
          await processBody({ targets: [{ namespace: 'reports', resources: ['categories'] }] });

          expectRunningResponse([], [{ name: 'categories', reason: 'needs_params' }]);
        });

        it('enqueues one and skips the other when the same resource name repeats with satisfying and missing parameters', async () => {
          await processBody({
            targets: [{
              namespace: 'reports',
              resources: [
                { name: 'categories', parameters: { id: 1 } },
                { name: 'categories', parameters: { other: 'value' } },
              ],
            }],
          });

          expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith(
            'ResourceRequestJob',
            { resourceRequest: categoryRequest, parameters: { id: 1 } },
          );
          expectRunningResponse(
            ['categories'],
            [{ name: 'categories', reason: 'needs_params', parameters: { other: 'value' } }],
          );
        });

        it('threads extra parameter keys through to a request with no {:token} at all', async () => {
          NamespaceMap.reset();
          const { home_page: homePageRequest } = NamespaceMapUtils.build({ reports: { home_page: '/' } });

          await processBody({
            targets: [{ namespace: 'reports', resources: [{ name: 'home_page', parameters: { unrelated: 'value' } }] }],
          });

          expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith(
            'ResourceRequestJob',
            { resourceRequest: homePageRequest, parameters: { unrelated: 'value' } },
          );
          expectRunningResponse(['home_page']);
        });
      });
    });
  });
});
