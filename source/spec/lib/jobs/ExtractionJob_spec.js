import { Job } from 'deku-swarm';
import { ParserNotFound } from '../../../lib/exceptions/registry/ParserNotFound.js';
import { ExtractionJob } from '../../../lib/jobs/ExtractionJob.js';
import { ResourceRequestEmit } from '../../../lib/models/request/ResourceRequestEmit.js';
import { ResourceRequestParser } from '../../../lib/models/request/ResourceRequestParser.js';
import { ParserRegistry } from '../../../lib/registry/ParserRegistry.js';

describe('ExtractionJob', () => {
  let job;
  let rawBody;
  let parser;
  let parserRegistry;
  let parserImpl;
  let jobRegistry;
  let logContext;

  beforeEach(() => {
    logContext = jasmine.createSpyObj('logContext', ['debug', 'info', 'warn', 'error']);
    rawBody = 'price: $42.50 total';
    parser = new ResourceRequestParser({ type: 'regex', match: '\\$(\\d+\\.\\d+)', field: 'price' });
    parserImpl = jasmine.createSpyObj('parserImpl', ['extract']);
    parserRegistry = new ParserRegistry({ regex: parserImpl });
    jobRegistry = jasmine.createSpyObj('jobRegistry', ['enqueue']);
  });

  describe('#constructor', () => {
    it('is an instance of Job', () => {
      job = new ExtractionJob({ id: 'test-id', rawBody, parser, parserRegistry });
      expect(job).toBeInstanceOf(Job);
    });
  });

  describe('#maxRetries', () => {
    beforeEach(() => {
      job = new ExtractionJob({ id: 'test-id', rawBody, parser, parserRegistry });
    });

    it('returns 1', () => {
      expect(job.maxRetries).toBe(1);
    });
  });

  describe('#arguments', () => {
    it('returns the parserType', () => {
      job = new ExtractionJob({ id: 'test-id', rawBody, parser, parserRegistry });
      expect(job.arguments).toEqual({ parserType: 'regex' });
    });

    describe('when originUrl is provided', () => {
      it('includes originUrl in the arguments', () => {
        const originUrl = 'https://example.com/page.html';
        job = new ExtractionJob({ id: 'test-id', rawBody, parser, parserRegistry, originUrl });
        expect(job.arguments).toEqual({ parserType: 'regex', originUrl });
      });
    });

    describe('when originUrl is not provided', () => {
      it('does not include originUrl in the arguments', () => {
        job = new ExtractionJob({ id: 'test-id', rawBody, parser, parserRegistry });
        expect(job.arguments.originUrl).toBeUndefined();
      });
    });
  });

  describe('#perform', () => {
    beforeEach(() => {
      job = new ExtractionJob({ id: 'test-id', rawBody, parser, parserRegistry });
    });

    describe('when the pattern matches', () => {
      it('calls the parser implementation with the raw body and attributes', async () => {
        parserImpl.extract.and.returnValue([{ price: '42.50' }]);
        await job.perform(logContext);
        expect(parserImpl.extract).toHaveBeenCalledOnceWith(rawBody, parser.attributes);
      });

      it('logs the extracted items via logContext.debug', async () => {
        const items = [{ price: '42.50' }];
        parserImpl.extract.and.returnValue(items);
        await job.perform(logContext);
        expect(logContext.debug).toHaveBeenCalledWith(
          jasmine.stringMatching(/extracted 1 item/),
          { items },
        );
      });

      it('does not exhaust after a successful attempt', async () => {
        parserImpl.extract.and.returnValue([{ price: '42.50' }]);
        await job.perform(logContext);
        expect(job.exhausted()).toBeFalse();
      });
    });

    describe('when emit is present', () => {
      const emit = new ResourceRequestEmit({ method: 'POST', url: 'https://example.com/items/{:id}' });
      const parameters = { id: '42' };

      beforeEach(() => {
        job = new ExtractionJob({ id: 'test-id', rawBody, parser, parserRegistry, jobRegistry, emit, parameters });
      });

      it('enqueues one Emit job per extracted item', async () => {
        const items = [{ price: '42.50' }, { price: '10.00' }];
        parserImpl.extract.and.returnValue(items);
        await job.perform(logContext);
        expect(jobRegistry.enqueue).toHaveBeenCalledTimes(2);
        expect(jobRegistry.enqueue).toHaveBeenCalledWith('Emit', { item: items[0], emit, parameters });
        expect(jobRegistry.enqueue).toHaveBeenCalledWith('Emit', { item: items[1], emit, parameters });
      });

      it('does not enqueue when there are no extracted items', async () => {
        parserImpl.extract.and.returnValue([]);
        await job.perform(logContext);
        expect(jobRegistry.enqueue).not.toHaveBeenCalled();
      });
    });

    describe('when emit is absent', () => {
      beforeEach(() => {
        job = new ExtractionJob({ id: 'test-id', rawBody, parser, parserRegistry, jobRegistry });
      });

      it('does not enqueue any Emit job', async () => {
        parserImpl.extract.and.returnValue([{ price: '42.50' }]);
        await job.perform(logContext);
        expect(jobRegistry.enqueue).not.toHaveBeenCalled();
      });
    });

    describe('when the pattern does not match', () => {
      it('logs zero extracted items', async () => {
        parserImpl.extract.and.returnValue([]);
        await job.perform(logContext);
        expect(logContext.debug).toHaveBeenCalledWith(
          jasmine.stringMatching(/extracted 0 item/),
          { items: [] },
        );
      });
    });

    describe('when the parser type is not registered', () => {
      beforeEach(() => {
        parser = new ResourceRequestParser({ type: 'json_path', match: 'x', field: 'y' });
        job = new ExtractionJob({ id: 'test-id', rawBody, parser, parserRegistry });
      });

      it('sets lastError to a ParserNotFound error', async () => {
        await job.perform(logContext).catch(() => {});
        expect(job.lastError).toBeInstanceOf(ParserNotFound);
      });

      it('rethrows the error', async () => {
        await expectAsync(job.perform(logContext)).toBeRejectedWithError(ParserNotFound);
      });

      it('is exhausted after one failure', async () => {
        await job.perform(logContext).catch(() => {});
        expect(job.exhausted()).toBeTrue();
      });
    });

    describe('when the parser implementation throws', () => {
      const error = new Error('extraction error');

      beforeEach(() => {
        parserImpl.extract.and.throwError(error);
      });

      it('sets lastError to the thrown error', async () => {
        await job.perform(logContext).catch(() => {});
        expect(job.lastError).toEqual(error);
      });

      it('is exhausted after one failure', async () => {
        await job.perform(logContext).catch(() => {});
        expect(job.exhausted()).toBeTrue();
      });
    });
  });

  describe('#exhausted', () => {
    beforeEach(() => {
      job = new ExtractionJob({ id: 'test-id', rawBody, parser, parserRegistry });
    });

    it('returns false with zero attempts', () => {
      expect(job.exhausted()).toBeFalse();
    });
  });
});
