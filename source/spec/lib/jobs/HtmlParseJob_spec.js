import { Job } from '../../../lib/background/Job.js';
import { HtmlParseJob } from '../../../lib/jobs/HtmlParseJob.js';
import { HtmlParser } from '../../../lib/utils/HtmlParser.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { AssetRequestFactory } from '../../support/factories/AssetRequestFactory.js';
import { ClientRegistryFactory } from '../../support/factories/ClientRegistryFactory.js';

describe('HtmlParseJob', () => {
  let job;
  let rawHtml;
  let assetRequests;
  let jobRegistry;
  let clientRegistry;

  const baseUrl = 'https://example.com';

  beforeEach(() => {
    spyOn(Logger, 'debug').and.stub();
    spyOn(Logger, 'info').and.stub();
    spyOn(Logger, 'warn').and.stub();
    spyOn(Logger, 'error').and.stub();

    rawHtml = '<html><head>' +
      '<link rel="stylesheet" href="/styles.css">' +
      '<script src="/app.js"></script>' +
      '</head></html>';

    jobRegistry = jasmine.createSpyObj('jobRegistry', ['enqueue']);
    clientRegistry = ClientRegistryFactory.build();
  });

  describe('#constructor', () => {
    it('is an instance of Job', () => {
      assetRequests = [];
      job = new HtmlParseJob({ id: 'test-id', rawHtml, assetRequests, jobRegistry, clientRegistry });
      expect(job).toBeInstanceOf(Job);
    });
  });

  describe('#maxRetries', () => {
    beforeEach(() => {
      assetRequests = [];
      job = new HtmlParseJob({ id: 'test-id', rawHtml, assetRequests, jobRegistry, clientRegistry });
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
      job = new HtmlParseJob({ id: 'test-id', rawHtml, assetRequests, jobRegistry, clientRegistry });
      expect(job.arguments).toEqual({ assetCount: 2 });
    });

    it('returns assetCount of 0 when no asset requests', () => {
      assetRequests = [];
      job = new HtmlParseJob({ id: 'test-id', rawHtml, assetRequests, jobRegistry, clientRegistry });
      expect(job.arguments).toEqual({ assetCount: 0 });
    });
  });

  describe('#perform', () => {
    describe('with a single AssetRequest', () => {
      beforeEach(() => {
        assetRequests = [AssetRequestFactory.build({ selector: 'link[rel="stylesheet"]', attribute: 'href' })];
        job = new HtmlParseJob({ id: 'test-id', rawHtml, assetRequests, jobRegistry, clientRegistry });
      });

      it('calls HtmlParser.parse once for the AssetRequest', async () => {
        spyOn(HtmlParser, 'parse').and.returnValue([]);
        await job.perform();
        expect(HtmlParser.parse).toHaveBeenCalledOnceWith(
          rawHtml,
          'link[rel="stylesheet"]',
          'href'
        );
      });

      it('enqueues one AssetDownloadJob per discovered URL', async () => {
        spyOn(HtmlParser, 'parse').and.returnValue(['/styles.css']);
        await job.perform();
        expect(jobRegistry.enqueue).toHaveBeenCalledOnceWith('AssetDownload', jasmine.objectContaining({
          url: `${baseUrl}/styles.css`,
        }));
      });

      it('enqueues multiple AssetDownloadJobs for multiple discovered URLs', async () => {
        spyOn(HtmlParser, 'parse').and.returnValue(['/styles.css', '/theme.css']);
        await job.perform();
        expect(jobRegistry.enqueue).toHaveBeenCalledTimes(2);
      });
    });

    describe('URL resolution', () => {
      beforeEach(() => {
        assetRequests = [AssetRequestFactory.build({ selector: 'link', attribute: 'href' })];
        job = new HtmlParseJob({ id: 'test-id', rawHtml, assetRequests, jobRegistry, clientRegistry });
      });

      it('enqueues absolute https URLs as-is', async () => {
        spyOn(HtmlParser, 'parse').and.returnValue(['https://cdn.example.com/app.css']);
        await job.perform();
        expect(jobRegistry.enqueue).toHaveBeenCalledWith('AssetDownload', jasmine.objectContaining({
          url: 'https://cdn.example.com/app.css',
        }));
      });

      it('enqueues absolute http URLs as-is', async () => {
        spyOn(HtmlParser, 'parse').and.returnValue(['http://cdn.example.com/app.css']);
        await job.perform();
        expect(jobRegistry.enqueue).toHaveBeenCalledWith('AssetDownload', jasmine.objectContaining({
          url: 'http://cdn.example.com/app.css',
        }));
      });

      it('prepends https: for protocol-relative URLs', async () => {
        spyOn(HtmlParser, 'parse').and.returnValue(['//cdn.example.com/app.css']);
        await job.perform();
        expect(jobRegistry.enqueue).toHaveBeenCalledWith('AssetDownload', jasmine.objectContaining({
          url: 'https://cdn.example.com/app.css',
        }));
      });

      it('concatenates root-relative URLs with the client base URL', async () => {
        spyOn(HtmlParser, 'parse').and.returnValue(['/assets/app.css']);
        await job.perform();
        expect(jobRegistry.enqueue).toHaveBeenCalledWith('AssetDownload', jasmine.objectContaining({
          url: `${baseUrl}/assets/app.css`,
        }));
      });
    });

    describe('when the selector matches zero elements', () => {
      beforeEach(() => {
        assetRequests = [AssetRequestFactory.build({ selector: 'video', attribute: 'src' })];
        job = new HtmlParseJob({ id: 'test-id', rawHtml, assetRequests, jobRegistry, clientRegistry });
        spyOn(HtmlParser, 'parse').and.returnValue([]);
      });

      it('does not enqueue any AssetDownloadJob', async () => {
        await job.perform();
        expect(jobRegistry.enqueue).not.toHaveBeenCalled();
      });
    });

    describe('with multiple AssetRequest rules', () => {
      beforeEach(() => {
        assetRequests = [
          AssetRequestFactory.build({ selector: 'link[rel="stylesheet"]', attribute: 'href' }),
          AssetRequestFactory.build({ selector: 'script[src]', attribute: 'src' }),
        ];
        job = new HtmlParseJob({ id: 'test-id', rawHtml, assetRequests, jobRegistry, clientRegistry });
        spyOn(HtmlParser, 'parse').and.callFake((_html, selector) => {
          if (selector === 'link[rel="stylesheet"]') return ['/styles.css'];
          if (selector === 'script[src]') return ['/app.js'];
          return [];
        });
      });

      it('calls HtmlParser.parse once per AssetRequest', async () => {
        await job.perform();
        expect(HtmlParser.parse).toHaveBeenCalledTimes(2);
      });

      it('enqueues one AssetDownloadJob per discovered URL across all rules', async () => {
        await job.perform();
        expect(jobRegistry.enqueue).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('#exhausted', () => {
    beforeEach(() => {
      assetRequests = [];
      job = new HtmlParseJob({ id: 'test-id', rawHtml, assetRequests, jobRegistry, clientRegistry });
    });

    it('returns false with zero attempts', () => {
      expect(job.exhausted()).toBeFalse();
    });

    it('is exhausted after one failure', async () => {
      assetRequests = [AssetRequestFactory.build()];
      job = new HtmlParseJob({ id: 'test-id', rawHtml, assetRequests, jobRegistry, clientRegistry });
      spyOn(HtmlParser, 'parse').and.throwError(new Error('parse failure'));
      await job.perform().catch(() => {});
      expect(job.exhausted()).toBeTrue();
    });
  });
});
