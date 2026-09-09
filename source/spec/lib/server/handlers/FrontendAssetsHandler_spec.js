import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RequestHandler } from '../../../../lib/common/server/RequestHandler.js';
import { ForbiddenError } from '../../../../lib/exceptions/http/ForbiddenError.js';
import { NotFoundError } from '../../../../lib/exceptions/http/NotFoundError.js';
import { FrontendAssetsHandler } from '../../../../lib/server/handlers/FrontendAssetsHandler.js';

const FIXTURES = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../support/fixtures/extensions',
);
const FRONTEND_DIR = path.join(FIXTURES, 'frontend-ok', 'frontend');

describe('FrontendAssetsHandler', () => {
  const originalEnv = { ...process.env };
  let res;

  const enable = () => {
    process.env.NAVI_EXTENSIONS_ENABLED = 'true';
    process.env.NAVI_EXTENSIONS_DIR = path.join(FIXTURES, 'frontend-ok');
  };

  beforeEach(() => {
    res = { sendFile: jasmine.createSpy('sendFile') };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('is a RequestHandler', () => {
    expect(new FrontendAssetsHandler({}, res)).toBeInstanceOf(RequestHandler);
  });

  describe('when the feature is disabled', () => {
    beforeEach(() => {
      delete process.env.NAVI_EXTENSIONS_ENABLED;
      process.env.NAVI_EXTENSIONS_DIR = path.join(FIXTURES, 'frontend-ok');
    });

    it('throws a NotFoundError without touching sendFile', () => {
      const req = { params: { path: 'a.js' } };

      expect(() => new FrontendAssetsHandler(req, res).handle()).toThrowError(NotFoundError);
      expect(res.sendFile).not.toHaveBeenCalled();
    });
  });

  describe('when enabled and the path is valid', () => {
    beforeEach(enable);

    it('sends the resolved bundle file (string param)', () => {
      const req = { params: { path: 'a.js' } };

      new FrontendAssetsHandler(req, res).handle();

      expect(res.sendFile).toHaveBeenCalledWith(path.join(FRONTEND_DIR, 'a.js'));
    });

    it('sends the resolved bundle file (array param)', () => {
      const req = { params: { path: ['b.css'] } };

      new FrontendAssetsHandler(req, res).handle();

      expect(res.sendFile).toHaveBeenCalledWith(path.join(FRONTEND_DIR, 'b.css'));
    });
  });

  describe('when the path attempts directory traversal', () => {
    beforeEach(enable);

    it('throws a ForbiddenError (string param)', () => {
      const req = { params: { path: '../../secret.txt' } };

      expect(() => new FrontendAssetsHandler(req, res).handle()).toThrowError(ForbiddenError);
      expect(res.sendFile).not.toHaveBeenCalled();
    });

    it('throws a ForbiddenError (array param)', () => {
      const req = { params: { path: ['..', 'secret.txt'] } };

      expect(() => new FrontendAssetsHandler(req, res).handle()).toThrowError(ForbiddenError);
    });
  });
});
