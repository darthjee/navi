import { Job } from 'deku-swarm';
import { ParserNotFound } from '../../../lib/exceptions/registry/ParserNotFound.js';
import { ResourceRequestParser } from '../../../lib/models/request/resource_request/ResourceRequestParser.js';
import { ExtractionJobSpecUtils } from '../../support/utils/ExtractionJobSpecUtils.js';

const { emit, parameters, singleItem, twoItems } = ExtractionJobSpecUtils;
const unregisteredParser = new ResourceRequestParser({ type: 'json_path', match: 'x', field: 'y' });

describe('ExtractionJob', () => {
  const ctx = ExtractionJobSpecUtils.setup();

  describe('#constructor', () => {
    it('is an instance of Job', () => {
      ctx.buildJob();
      expect(ctx.job).toBeInstanceOf(Job);
    });
  });

  describe('#maxRetries', () => {
    beforeEach(() => {
      ctx.buildJob();
    });

    it('returns 1', () => {
      expect(ctx.job.maxRetries).toBe(1);
    });
  });

  describe('#arguments', () => {
    it('returns the parserType', () => {
      ctx.buildJob();
      expect(ctx.job.arguments).toEqual({ parserType: 'regex' });
    });

    describe('when originUrl is provided', () => {
      it('includes originUrl in the arguments', () => {
        const url = 'https://example.com/page.html';
        ctx.buildJob({ originUrl: url });
        expect(ctx.job.arguments).toEqual({ parserType: 'regex', originUrl: url });
      });
    });

    describe('when originUrl is not provided', () => {
      it('does not include originUrl in the arguments', () => {
        ctx.buildJob();
        expect(ctx.job.arguments.originUrl).toBeUndefined();
      });
    });
  });

  describe('#perform', () => {
    beforeEach(() => {
      ctx.buildJob();
    });

    describe('when the pattern matches', () => {
      it('calls the parser implementation with the raw body and attributes', async () => {
        await ctx.performWith(singleItem);
        expect(ctx.parserImpl.extract).toHaveBeenCalledOnceWith(ctx.rawBody, ctx.parser.attributes);
      });

      it('logs the extracted items via logContext.debug', async () => {
        await ctx.performWith(singleItem);
        expect(ctx.logContext.debug).toHaveBeenCalledWith(
          jasmine.stringMatching(/extracted 1 item/),
          { items: singleItem },
        );
      });

      it('does not exhaust after a successful attempt', async () => {
        await ctx.performWith(singleItem);
        expect(ctx.job.exhausted()).toBeFalse();
      });
    });

    describe('when emit is present', () => {
      beforeEach(() => {
        ctx.buildJob({ emit, parameters });
      });

      it('enqueues one Emit job per extracted item', async () => {
        await ctx.performWith(twoItems);
        expect(ctx.jobRegistry.enqueue).toHaveBeenCalledTimes(2);
        twoItems.forEach((item) => ctx.expectEmitEnqueued(item));
      });

      it('does not enqueue when there are no extracted items', async () => {
        await ctx.performWith([]);
        expect(ctx.jobRegistry.enqueue).not.toHaveBeenCalled();
      });
    });

    describe('when emit is absent', () => {
      it('does not enqueue any Emit job', async () => {
        await ctx.performWith(singleItem);
        expect(ctx.jobRegistry.enqueue).not.toHaveBeenCalled();
      });
    });

    describe('when the pattern does not match', () => {
      it('logs zero extracted items', async () => {
        await ctx.performWith([]);
        expect(ctx.logContext.debug).toHaveBeenCalledWith(
          jasmine.stringMatching(/extracted 0 item/),
          { items: [] },
        );
      });
    });

    describe('when the parser type is not registered', () => {
      beforeEach(() => {
        ctx.buildJob({ parser: unregisteredParser });
      });

      it('rethrows the error', async () => {
        await expectAsync(ctx.job.perform(ctx.logContext)).toBeRejectedWithError(ParserNotFound);
      });
    });

    describe('when the extraction fails', () => {
      const error = new Error('extraction error');

      [
        {
          description: 'the parser type is not registered',
          title: 'sets lastError to a ParserNotFound error',
          arrange: () => {
            ctx.buildJob({ parser: unregisteredParser });
          },
          expectedError: jasmine.any(ParserNotFound),
        },
        {
          description: 'the parser implementation throws',
          title: 'sets lastError to the thrown error',
          arrange: () => {
            ctx.parserImpl.extract.and.throwError(error);
          },
          expectedError: error,
        },
      ].forEach(({ description, title, arrange, expectedError }) => {
        describe(`because ${description}`, () => {
          beforeEach(arrange);

          it(title, async () => {
            await ctx.performIgnoringFailure();
            expect(ctx.job.lastError).toEqual(expectedError);
          });

          it('is exhausted after one failure', async () => {
            await ctx.performIgnoringFailure();
            expect(ctx.job.exhausted()).toBeTrue();
          });
        });
      });
    });
  });

  describe('#exhausted', () => {
    beforeEach(() => {
      ctx.buildJob();
    });

    it('returns false with zero attempts', () => {
      expect(ctx.job.exhausted()).toBeFalse();
    });
  });
});
