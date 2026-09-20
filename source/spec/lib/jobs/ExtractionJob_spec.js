import { Job } from 'deku-swarm';
import { ParserNotFound } from '../../../lib/exceptions/registry/ParserNotFound.js';
import { ResourceRequestParser } from '../../../lib/models/request/resource_request/ResourceRequestParser.js';
import { EmissionRegistry } from '../../../lib/registry/EmissionRegistry.js';
import { ExtractionRegistry } from '../../../lib/registry/ExtractionRegistry.js';
import { ParserRegistry } from '../../../lib/registry/ParserRegistry.js';
import { ExtractionJobFactory } from '../../support/factories/ExtractionJobFactory.js';
import { ResourceRequestEmitFactory } from '../../support/factories/ResourceRequestEmitFactory.js';

const emit = ResourceRequestEmitFactory.build({ method: 'POST', url: 'https://example.com/items/{:id}' });
const parameters = { id: '42' };
const originUrl = 'https://example.com/list?page=1';
const singleItem = [{ price: '42.50' }];
const twoItems = [{ price: '42.50' }, { price: '10.00' }];
const unregisteredParser = new ResourceRequestParser({ type: 'json_path', match: 'x', field: 'y' });

describe('ExtractionJob', () => {
  let job;
  let rawBody;
  let parser;
  let parserRegistry;
  let parserImpl;
  let jobRegistry;
  let logContext;

  const buildJob = (overrides = {}) => {
    job = ExtractionJobFactory.build({ rawBody, parser, parserRegistry, jobRegistry, ...overrides });
  };

  const performWith = async (items) => {
    parserImpl.extract.and.returnValue(items);
    await job.perform(logContext);
  };

  const performIgnoringFailure = () => job.perform(logContext).catch(() => {});

  const expectEmitEnqueued = (item, extractionId = null) => {
    expect(jobRegistry.enqueue).toHaveBeenCalledWith('Emit', { item, emit, parameters, extractionId });
  };

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
      buildJob();
      expect(job).toBeInstanceOf(Job);
    });
  });

  describe('#maxRetries', () => {
    beforeEach(() => {
      buildJob();
    });

    it('returns 1', () => {
      expect(job.maxRetries).toBe(1);
    });
  });

  describe('#arguments', () => {
    it('returns the parserType', () => {
      buildJob();
      expect(job.arguments).toEqual({ parserType: 'regex' });
    });

    describe('when originUrl is provided', () => {
      it('includes originUrl in the arguments', () => {
        const url = 'https://example.com/page.html';
        buildJob({ originUrl: url });
        expect(job.arguments).toEqual({ parserType: 'regex', originUrl: url });
      });
    });

    describe('when originUrl is not provided', () => {
      it('does not include originUrl in the arguments', () => {
        buildJob();
        expect(job.arguments.originUrl).toBeUndefined();
      });
    });
  });

  describe('#perform', () => {
    beforeEach(() => {
      buildJob();
    });

    describe('when the pattern matches', () => {
      it('calls the parser implementation with the raw body and attributes', async () => {
        await performWith(singleItem);
        expect(parserImpl.extract).toHaveBeenCalledOnceWith(rawBody, parser.attributes);
      });

      it('logs the extracted items via logContext.debug', async () => {
        await performWith(singleItem);
        expect(logContext.debug).toHaveBeenCalledWith(
          jasmine.stringMatching(/extracted 1 item/),
          { items: singleItem },
        );
      });

      it('does not exhaust after a successful attempt', async () => {
        await performWith(singleItem);
        expect(job.exhausted()).toBeFalse();
      });
    });

    describe('when emit is present', () => {
      beforeEach(() => {
        buildJob({ emit, parameters });
      });

      it('enqueues one Emit job per extracted item', async () => {
        await performWith(twoItems);
        expect(jobRegistry.enqueue).toHaveBeenCalledTimes(2);
        twoItems.forEach((item) => expectEmitEnqueued(item));
      });

      it('does not enqueue when there are no extracted items', async () => {
        await performWith([]);
        expect(jobRegistry.enqueue).not.toHaveBeenCalled();
      });
    });

    describe('when emit is absent', () => {
      it('does not enqueue any Emit job', async () => {
        await performWith(singleItem);
        expect(jobRegistry.enqueue).not.toHaveBeenCalled();
      });
    });

    describe('when the pattern does not match', () => {
      it('logs zero extracted items', async () => {
        await performWith([]);
        expect(logContext.debug).toHaveBeenCalledWith(
          jasmine.stringMatching(/extracted 0 item/),
          { items: [] },
        );
      });
    });

    describe('when the parser type is not registered', () => {
      beforeEach(() => {
        buildJob({ parser: unregisteredParser });
      });

      it('rethrows the error', async () => {
        await expectAsync(job.perform(logContext)).toBeRejectedWithError(ParserNotFound);
      });
    });

    describe('when the extraction fails', () => {
      const error = new Error('extraction error');

      [
        {
          description: 'the parser type is not registered',
          title: 'sets lastError to a ParserNotFound error',
          arrange: () => {
            buildJob({ parser: unregisteredParser });
          },
          expectedError: jasmine.any(ParserNotFound),
        },
        {
          description: 'the parser implementation throws',
          title: 'sets lastError to the thrown error',
          arrange: () => {
            parserImpl.extract.and.throwError(error);
          },
          expectedError: error,
        },
      ].forEach(({ description, title, arrange, expectedError }) => {
        describe(`because ${description}`, () => {
          beforeEach(arrange);

          it(title, async () => {
            await performIgnoringFailure();
            expect(job.lastError).toEqual(expectedError);
          });

          it('is exhausted after one failure', async () => {
            await performIgnoringFailure();
            expect(job.exhausted()).toBeTrue();
          });
        });
      });
    });
  });

  describe('#exhausted', () => {
    beforeEach(() => {
      buildJob();
    });

    it('returns false with zero attempts', () => {
      expect(job.exhausted()).toBeFalse();
    });
  });

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
            buildJob(jobOptions);
          });

          it(title, async () => {
            await performWith(items);

            expect(EmissionRegistry.counts.extracted).toBe(expectedExtracted);
          });
        });
      });
    });

    describe('when the registry has not been built', () => {
      beforeEach(() => {
        buildJob();
      });

      it('still performs without throwing', async () => {
        parserImpl.extract.and.returnValue(singleItem);

        await expectAsync(job.perform(logContext)).toBeResolved();
      });
    });
  });

  describe('extraction tracking', () => {
    beforeEach(() => {
      buildJob({ emit, parameters, originUrl });
    });

    describe('when the registry has been built', () => {
      beforeEach(() => {
        ExtractionRegistry.build();
      });

      afterEach(() => {
        ExtractionRegistry.reset();
      });

      it('records an extraction with parserType, originUrl and itemCount', async () => {
        await performWith(twoItems);

        const [record] = ExtractionRegistry.getRecords();
        expect(record.parserType).toBe('regex');
        expect(record.originUrl).toBe(originUrl);
        expect(record.itemCount).toBe(2);
      });

      it('adds the item count to the extracted counter', async () => {
        await performWith(twoItems);

        expect(ExtractionRegistry.counts.extracted).toBe(2);
      });

      it('passes the recorded extraction id to each Emit enqueue payload', async () => {
        await performWith(twoItems);

        expectEmitEnqueued(twoItems[0], ExtractionRegistry.getRecords()[0].id);
      });

      it('still increments the emission extracted counter', async () => {
        EmissionRegistry.build();

        await performWith(singleItem);

        expect(EmissionRegistry.counts.extracted).toBe(1);
        EmissionRegistry.reset();
      });
    });

    describe('when the registry has not been built', () => {
      it('still performs and enqueues with a null extractionId', async () => {
        await performWith(singleItem);

        expectEmitEnqueued(singleItem[0]);
      });
    });
  });
});
