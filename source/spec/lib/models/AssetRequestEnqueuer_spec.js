import { AssetRequestEnqueuer } from '../../../lib/models/AssetRequestEnqueuer.js';
import { Application } from '../../../lib/services/Application.js';
import { HtmlParser } from '../../../lib/utils/HtmlParser.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { AssetRequestFactory } from '../../support/factories/AssetRequestFactory.js';
import { ClientRegistryFactory } from '../../support/factories/ClientRegistryFactory.js';

describe('AssetRequestEnqueuer', () => {
  let rawHtml;
  let assetRequest;
  let jobRegistry;
  let clientRegistry;

  const baseUrl = 'https://example.com';

  beforeEach(() => {
    spyOn(Logger, 'warn').and.stub();

    rawHtml = '<html><head><link rel="stylesheet" href="/styles.css"></head></html>';
    assetRequest = AssetRequestFactory.build({ selector: 'link[rel="stylesheet"]', attribute: 'href' });
    jobRegistry = jasmine.createSpyObj('jobRegistry', ['enqueue']);
    clientRegistry = ClientRegistryFactory.build();
  });

  describe('#enqueue', () => {
    it('calls HtmlParser.parse with the raw HTML, selector, and attribute', () => {
      spyOn(HtmlParser, 'parse').and.returnValue([]);
      new AssetRequestEnqueuer(rawHtml, assetRequest, jobRegistry, clientRegistry).enqueue();
      expect(HtmlParser.parse).toHaveBeenCalledOnceWith(rawHtml, assetRequest.selector, assetRequest.attribute);
    });

    describe('when no URLs are found', () => {
      beforeEach(() => {
        spyOn(HtmlParser, 'parse').and.returnValue([]);
      });

      it('does not enqueue any job', () => {
        new AssetRequestEnqueuer(rawHtml, assetRequest, jobRegistry, clientRegistry).enqueue();
        expect(jobRegistry.enqueue).not.toHaveBeenCalled();
      });
    });

    describe('when a single URL is found', () => {
      beforeEach(() => {
        spyOn(HtmlParser, 'parse').and.returnValue(['/styles.css']);
      });

      it('enqueues one AssetDownloadJob', () => {
        new AssetRequestEnqueuer(rawHtml, assetRequest, jobRegistry, clientRegistry).enqueue();
        expect(jobRegistry.enqueue).toHaveBeenCalledOnceWith('AssetDownload', jasmine.objectContaining({
          url: `${baseUrl}/styles.css`,
        }));
      });

      it('passes the client and status from the asset request', () => {
        new AssetRequestEnqueuer(rawHtml, assetRequest, jobRegistry, clientRegistry).enqueue();
        expect(jobRegistry.enqueue).toHaveBeenCalledOnceWith('AssetDownload', jasmine.objectContaining({
          client: assetRequest.client,
          status: assetRequest.status,
        }));
      });
    });

    describe('when multiple URLs are found', () => {
      beforeEach(() => {
        spyOn(HtmlParser, 'parse').and.returnValue(['/a.css', '/b.css']);
      });

      it('enqueues one AssetDownloadJob per URL', () => {
        new AssetRequestEnqueuer(rawHtml, assetRequest, jobRegistry, clientRegistry).enqueue();
        expect(jobRegistry.enqueue).toHaveBeenCalledTimes(2);
      });
    });

    describe('URL resolution', () => {
      beforeEach(() => {
        assetRequest = AssetRequestFactory.build({ selector: 'link', attribute: 'href' });
      });

      it('uses absolute https URLs as-is', () => {
        spyOn(HtmlParser, 'parse').and.returnValue(['https://cdn.example.com/app.css']);
        new AssetRequestEnqueuer(rawHtml, assetRequest, jobRegistry, clientRegistry).enqueue();
        expect(jobRegistry.enqueue).toHaveBeenCalledWith('AssetDownload', jasmine.objectContaining({
          url: 'https://cdn.example.com/app.css',
        }));
      });

      it('uses absolute http URLs as-is', () => {
        spyOn(HtmlParser, 'parse').and.returnValue(['http://cdn.example.com/app.css']);
        new AssetRequestEnqueuer(rawHtml, assetRequest, jobRegistry, clientRegistry).enqueue();
        expect(jobRegistry.enqueue).toHaveBeenCalledWith('AssetDownload', jasmine.objectContaining({
          url: 'http://cdn.example.com/app.css',
        }));
      });

      it('prepends https: for protocol-relative URLs', () => {
        spyOn(HtmlParser, 'parse').and.returnValue(['//cdn.example.com/app.css']);
        new AssetRequestEnqueuer(rawHtml, assetRequest, jobRegistry, clientRegistry).enqueue();
        expect(jobRegistry.enqueue).toHaveBeenCalledWith('AssetDownload', jasmine.objectContaining({
          url: 'https://cdn.example.com/app.css',
        }));
      });

      it('concatenates root-relative URLs with the client base URL', () => {
        spyOn(HtmlParser, 'parse').and.returnValue(['/assets/app.css']);
        new AssetRequestEnqueuer(rawHtml, assetRequest, jobRegistry, clientRegistry).enqueue();
        expect(jobRegistry.enqueue).toHaveBeenCalledWith('AssetDownload', jasmine.objectContaining({
          url: `${baseUrl}/assets/app.css`,
        }));
      });
    });
  });

  describe('when the application is not running', () => {
    beforeEach(() => {
      spyOn(Application, 'status').and.returnValue('paused');
      spyOn(HtmlParser, 'parse').and.returnValue(['/styles.css']);
    });

    it('does not enqueue any job', () => {
      new AssetRequestEnqueuer(rawHtml, assetRequest, jobRegistry, clientRegistry).enqueue();
      expect(jobRegistry.enqueue).not.toHaveBeenCalled();
    });
  });
});
