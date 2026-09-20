import { Job } from 'deku-swarm';
import { HtmlParser } from '../../../lib/utils/HtmlParser.js';
import { AssetRequestFactory } from '../../support/factories/AssetRequestFactory.js';
import { HtmlParseJobFactory } from '../../support/factories/HtmlParseJobFactory.js';
import { NamespaceMapFactory } from '../../support/factories/NamespaceMapFactory.js';

describe('HtmlParseJob', () => {
  let job;
  let rawHtml;
  let assetRequests;
  let jobRegistry;
  let clientRegistry;
  let logContext;

  const baseUrl = 'https://example.com';

  const buildJob = (overrides = {}) => {
    job = HtmlParseJobFactory.build({ rawHtml, assetRequests, jobRegistry, clientRegistry, ...overrides });
  };

  const performWith = async (discovered) => {
    spyOn(HtmlParser, 'parse').and.returnValue(discovered);
    await job.perform(logContext);
  };

  beforeEach(() => {
    logContext = jasmine.createSpyObj('logContext', ['debug', 'info', 'warn', 'error']);

    rawHtml = '<html><head>' +
      '<link rel="stylesheet" href="/styles.css">' +
      '<script src="/app.js"></script>' +
      '</head></html>';

    jobRegistry = jasmine.createSpyObj('jobRegistry', ['enqueue']);
    clientRegistry = NamespaceMapFactory.build();
  });

  describe('#constructor', () => {
    it('is an instance of Job', () => {
      assetRequests = [];
      buildJob();
      expect(job).toBeInstanceOf(Job);
    });
  });

  describe('#maxRetries', () => {
    beforeEach(() => {
      assetRequests = [];
      buildJob();
    });

    it('returns 1', () => {
      expect(job.maxRetries).toBe(1);
    });
  });

  describe('#arguments', () => {
    it('returns the assetCount matching the number of asset requests', () => {
      assetRequests = [
        AssetRequestFactory.build({ selector: 'link', attribute: 'href' }),
        AssetRequestFactory.build({ selector: 'script', attribute: 'src' }),
      ];
      buildJob();
      expect(job.arguments).toEqual({ assetCount: 2 });
    });

    it('returns assetCount of 0 when no asset requests', () => {
      assetRequests = [];
      buildJob();
      expect(job.arguments).toEqual({ assetCount: 0 });
    });

    [
      {
        description: 'when originUrl is provided',
        title: 'includes originUrl in the arguments',
        originUrl: 'https://example.com/page.html',
        expectedArguments: { assetCount: 0, originUrl: 'https://example.com/page.html' },
      },
      {
        description: 'when originUrl is not provided',
        title: 'does not include originUrl in the arguments',
        originUrl: undefined,
        expectedArguments: { assetCount: 0 },
      },
    ].forEach(({ description, title, originUrl, expectedArguments }) => {
      describe(description, () => {
        it(title, () => {
          assetRequests = [];
          buildJob({ originUrl });
          expect(job.arguments).toEqual(expectedArguments);
        });
      });
    });
  });

  describe('#perform', () => {
    describe('with a single AssetRequest', () => {
      beforeEach(() => {
        assetRequests = [AssetRequestFactory.build({ selector: 'link[rel="stylesheet"]', attribute: 'href' })];
        buildJob();
      });

      it('calls HtmlParser.parse once for the AssetRequest', async () => {
        await performWith([]);
        expect(HtmlParser.parse).toHaveBeenCalledOnceWith(
          rawHtml,
          'link[rel="stylesheet"]',
          'href',
          logContext
        );
      });

      it('enqueues one AssetDownloadJob per discovered URL', async () => {
        await performWith(['/styles.css']);
        expect(jobRegistry.enqueue).toHaveBeenCalledOnceWith('AssetDownload', jasmine.objectContaining({
          url: `${baseUrl}/styles.css`,
        }));
      });

      it('enqueues multiple AssetDownloadJobs for multiple discovered URLs', async () => {
        await performWith(['/styles.css', '/theme.css']);
        expect(jobRegistry.enqueue).toHaveBeenCalledTimes(2);
      });
    });

    describe('URL resolution', () => {
      beforeEach(() => {
        assetRequests = [AssetRequestFactory.build({ selector: 'link', attribute: 'href' })];
        buildJob();
      });

      [
        {
          title: 'enqueues absolute https URLs as-is',
          discovered: 'https://cdn.example.com/app.css',
          expectedUrl: 'https://cdn.example.com/app.css',
        },
        {
          title: 'enqueues absolute http URLs as-is',
          discovered: 'http://cdn.example.com/app.css',
          expectedUrl: 'http://cdn.example.com/app.css',
        },
        {
          title: 'prepends https: for protocol-relative URLs',
          discovered: '//cdn.example.com/app.css',
          expectedUrl: 'https://cdn.example.com/app.css',
        },
        {
          title: 'concatenates root-relative URLs with the client base URL',
          discovered: '/assets/app.css',
          expectedUrl: `${baseUrl}/assets/app.css`,
        },
      ].forEach(({ title, discovered, expectedUrl }) => {
        it(title, async () => {
          await performWith([discovered]);
          expect(jobRegistry.enqueue).toHaveBeenCalledWith('AssetDownload', jasmine.objectContaining({
            url: expectedUrl,
          }));
        });
      });
    });

    describe('when the selector matches zero elements', () => {
      beforeEach(() => {
        assetRequests = [AssetRequestFactory.build({ selector: 'video', attribute: 'src' })];
        buildJob();
        spyOn(HtmlParser, 'parse').and.returnValue([]);
      });

      it('does not enqueue any AssetDownloadJob', async () => {
        await job.perform(logContext);
        expect(jobRegistry.enqueue).not.toHaveBeenCalled();
      });
    });

    describe('with multiple AssetRequest rules', () => {
      beforeEach(() => {
        assetRequests = [
          AssetRequestFactory.build({ selector: 'link[rel="stylesheet"]', attribute: 'href' }),
          AssetRequestFactory.build({ selector: 'script[src]', attribute: 'src' }),
        ];
        buildJob();
        spyOn(HtmlParser, 'parse').and.callFake((_html, selector) => {
          if (selector === 'link[rel="stylesheet"]') return ['/styles.css'];
          if (selector === 'script[src]') return ['/app.js'];
          return [];
        });
      });

      it('calls HtmlParser.parse once per AssetRequest', async () => {
        await job.perform(logContext);
        expect(HtmlParser.parse).toHaveBeenCalledTimes(2);
      });

      it('enqueues one AssetDownloadJob per discovered URL across all rules', async () => {
        await job.perform(logContext);
        expect(jobRegistry.enqueue).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('#exhausted', () => {
    beforeEach(() => {
      assetRequests = [];
      buildJob();
    });

    it('returns false with zero attempts', () => {
      expect(job.exhausted()).toBeFalse();
    });

    it('is exhausted after one failure', async () => {
      assetRequests = [AssetRequestFactory.build()];
      buildJob();
      spyOn(HtmlParser, 'parse').and.throwError(new Error('parse failure'));
      await job.perform(logContext).catch(() => {});
      expect(job.exhausted()).toBeTrue();
    });
  });
});
