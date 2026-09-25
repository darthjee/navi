import { EmissionRegistry } from '../../../lib/registry/EmissionRegistry.js';
import { ExtractionRegistry } from '../../../lib/registry/ExtractionRegistry.js';
import { ExtractionJobSpecUtils } from '../../support/utils/ExtractionJobSpecUtils.js';

const { emit, parameters, originUrl, singleItem, twoItems } = ExtractionJobSpecUtils;

describe('ExtractionJob', () => {
  const ctx = ExtractionJobSpecUtils.setup();

  describe('emission tracking', () => {
    describe('when the registry has been built', () => {
      beforeEach(() => {
        EmissionRegistry.build();
      });

      afterEach(() => {
        EmissionRegistry.reset();
      });

      [
        {
          description: 'when emit is present',
          title: 'increments the extracted counter by the item count',
          jobOptions: { emit, parameters },
          items: twoItems,
          expectedExtracted: 2,
        },
        {
          description: 'when emit is absent',
          title: 'still increments the extracted counter by the item count',
          jobOptions: {},
          items: singleItem,
          expectedExtracted: 1,
        },
      ].forEach(({ description, title, jobOptions, items, expectedExtracted }) => {
        describe(description, () => {
          beforeEach(() => {
            ctx.buildJob(jobOptions);
          });

          it(title, async () => {
            await ctx.performWith(items);

            expect(EmissionRegistry.counts.extracted).toBe(expectedExtracted);
          });
        });
      });
    });

    describe('when the registry has not been built', () => {
      beforeEach(() => {
        ctx.buildJob();
      });

      it('still performs without throwing', async () => {
        ctx.parserImpl.extract.and.returnValue(singleItem);

        await expectAsync(ctx.job.perform(ctx.logContext)).toBeResolved();
      });
    });
  });

  describe('extraction tracking', () => {
    beforeEach(() => {
      ctx.buildJob({ emit, parameters, originUrl });
    });

    describe('when the registry has been built', () => {
      beforeEach(() => {
        ExtractionRegistry.build();
      });

      afterEach(() => {
        ExtractionRegistry.reset();
      });

      it('records an extraction with parserType, originUrl and itemCount', async () => {
        await ctx.performWith(twoItems);

        const [record] = ExtractionRegistry.getRecords();
        expect(record.parserType).toBe('regex');
        expect(record.originUrl).toBe(originUrl);
        expect(record.itemCount).toBe(2);
      });

      it('adds the item count to the extracted counter', async () => {
        await ctx.performWith(twoItems);

        expect(ExtractionRegistry.counts.extracted).toBe(2);
      });

      it('passes the recorded extraction id to each Emit enqueue payload', async () => {
        await ctx.performWith(twoItems);

        ctx.expectEmitEnqueued(twoItems[0], ExtractionRegistry.getRecords()[0].id);
      });

      it('still increments the emission extracted counter', async () => {
        EmissionRegistry.build();

        await ctx.performWith(singleItem);

        expect(EmissionRegistry.counts.extracted).toBe(1);
        EmissionRegistry.reset();
      });
    });

    describe('when the registry has not been built', () => {
      it('still performs and enqueues with a null extractionId', async () => {
        await ctx.performWith(singleItem);

        ctx.expectEmitEnqueued(singleItem[0]);
      });
    });
  });
});
