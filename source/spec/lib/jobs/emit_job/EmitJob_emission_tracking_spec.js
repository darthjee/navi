import { EmissionRegistry } from '../../../../lib/registry/EmissionRegistry.js';
import { AxiosUtils } from '../../../support/utils/AxiosUtils.js';
import { EmitJobSpecUtils } from '../../../support/utils/EmitJobSpecUtils.js';

const { url } = EmitJobSpecUtils;

describe('EmitJob', () => {
  const ctx = EmitJobSpecUtils.setup();
  let response;

  const rebuildJob = (options) => EmitJobSpecUtils.rebuildJob(ctx, options);
  const performIgnoringFailure = (times) => EmitJobSpecUtils.performIgnoringFailure(ctx, times);
  const firstRecord = () => EmitJobSpecUtils.firstRecord();

  describe('emission tracking', () => {
    afterEach(() => {
      EmissionRegistry.reset();
    });

    describe('when the registry has been built', () => {
      beforeEach(() => {
        EmissionRegistry.build();
      });

      describe('when the emit is successful', () => {
        beforeEach(() => {
          response = AxiosUtils.stubPost(200, {});
        });

        it('records a success emission', async () => {
          await ctx.job.perform(ctx.logContext);

          const [record] = EmissionRegistry.getRecords();
          expect(record.status).toBe('success');
          expect(record.url).toBe(url);
          expect(record.method).toBe('POST');
          expect(record.httpStatus).toBe(200);
          expect(record.itemRef).toBe(7);
        });

        it('increments the emitted counter', async () => {
          await ctx.job.perform(ctx.logContext);

          expect(EmissionRegistry.counts.emitted).toBe(1);
        });
      });

      [
        {
          description: 'with a retryable status',
          rejection: { response: { status: 502 } },
          expectedRecord: { status: 'failed', httpStatus: 502, error: jasmine.stringContaining('502') },
        },
        {
          description: 'past maxRetries',
          jobOptions: { retries: 1 },
          rejection: { response: { status: 502 } },
          expectedRecord: { status: 'dead' },
        },
        {
          description: 'with a non-retryable 4xx',
          rejection: { response: { status: 404 } },
          expectedRecord: { status: 'dead', httpStatus: 404 },
        },
        {
          description: 'with a network-level error',
          rejection: new Error('network down'),
          expectedRecord: { status: 'failed', httpStatus: null },
        },
      ].forEach(({ description, jobOptions, rejection, expectedRecord }) => {
        describe(`when the emit fails ${description}`, () => {
          beforeEach(() => {
            rebuildJob(jobOptions);
            AxiosUtils.stubPostRejection(rejection);
          });

          it(`records a ${expectedRecord.status} emission`, async () => {
            await performIgnoringFailure();

            expect(firstRecord()).toEqual(jasmine.objectContaining(expectedRecord));
          });
        });
      });

      [
        {
          description: 'retryable status',
          jobOptions: {},
          title: 'increments the failed counter',
          expectedCounts: { failed: 1, dead: 0 },
        },
        {
          description: 'exhausted retries',
          jobOptions: { retries: 1 },
          title: 'increments the dead counter but not the failed counter',
          expectedCounts: { failed: 0, dead: 1 },
        },
      ].forEach(({ description, jobOptions, title, expectedCounts }) => {
        describe(`when the emit fails with a ${description}`, () => {
          beforeEach(() => {
            rebuildJob(jobOptions);
            AxiosUtils.stubPostRejection({ response: { status: 502 } });
          });

          it(title, async () => {
            await performIgnoringFailure();

            expect(EmissionRegistry.counts).toEqual(jasmine.objectContaining(expectedCounts));
          });
        });
      });

      describe('when the emitted item has no id', () => {
        beforeEach(() => {
          rebuildJob({ jobItem: { name: 'no-id' } });
          response = AxiosUtils.stubPost(200, {});
        });

        it('records a null itemRef', async () => {
          await ctx.job.perform(ctx.logContext);

          expect(firstRecord().itemRef).toBeNull();
        });
      });

      describe('when the success response carries no status', () => {
        beforeEach(() => {
          spyOn(ctx.client, 'emit').and.resolveTo(null);
        });

        it('records a null httpStatus', async () => {
          await ctx.job.perform(ctx.logContext);

          expect(firstRecord().httpStatus).toBeNull();
        });
      });

      describe('when the job carries an extractionId', () => {
        beforeEach(() => {
          rebuildJob({ extractionId: 99 });
        });

        [
          {
            status: 'success',
            arrange: () => AxiosUtils.stubPost(200, {}),
            perform: () => ctx.job.perform(ctx.logContext),
          },
          {
            status: 'failed',
            arrange: () => AxiosUtils.stubPostRejection({ response: { status: 502 } }),
            perform: () => performIgnoringFailure(),
          },
        ].forEach(({ status, arrange, perform }) => {
          it(`stamps extractionId on a ${status} emission`, async () => {
            arrange();

            await perform();

            expect(firstRecord().extractionId).toBe(99);
          });
        });
      });

      describe('when the job carries no extractionId', () => {
        it('records a null extractionId', async () => {
          response = AxiosUtils.stubPost(200, {});

          await ctx.job.perform(ctx.logContext);

          expect(firstRecord().extractionId).toBeNull();
        });
      });
    });

    describe('when the registry has not been built', () => {
      beforeEach(() => {
        response = AxiosUtils.stubPost(200, {});
      });

      it('still performs without throwing', async () => {
        await expectAsync(ctx.job.perform(ctx.logContext)).toBeResolvedTo(response);
      });
    });
  });
});
