import path from 'path';
import { RequestHandler } from '../../../../lib/common/server/RequestHandler.js';
import { ForbiddenError } from '../../../../lib/exceptions/http/ForbiddenError.js';
import { AssetsHandler } from '../../../../lib/server/handlers/AssetsHandler.js';
import { PathValidator } from '../../../../lib/server/PathValidator.js';

const fixtureAssetsDir = path.resolve('source/spec/support');

describe("describe('AssetsHandler'", () => {
  let res;
  let validator;

  beforeEach(() => {
    res = {
      sendFile: jasmine.createSpy('sendFile'),
      status:   jasmine.createSpy('status').and.returnValue({ json: jasmine.createSpy('json') }),
    };
    validator = new PathValidator(fixtureAssetsDir);
  });

  it('is an instance of RequestHandlerExecutor', () => {
    const executor = new AssetsHandler({}, res, fixtureAssetsDir, validator);
    expect(executor).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    describe('when the path is valid', () => {
      it('sends the asset file (string param)', () => {
        const req = { params: { path: 'fixtures' } };
        new AssetsHandler(req, res, fixtureAssetsDir, validator).handle();

        const [filePath] = res.sendFile.calls.mostRecent().args;
        expect(filePath).toContain(path.join(fixtureAssetsDir, 'fixtures'));
      });

      it('sends the asset file (array param)', () => {
        const req = { params: { path: ['fixtures'] } };
        new AssetsHandler(req, res, fixtureAssetsDir, validator).handle();

        const [filePath] = res.sendFile.calls.mostRecent().args;
        expect(filePath).toContain(path.join(fixtureAssetsDir, 'fixtures'));
      });
    });

    describe('when the path attempts directory traversal', () => {
      it('throws a ForbiddenError (string param)', () => {
        const req = { params: { path: '../secret.txt' } };
        expect(() => new AssetsHandler(req, res, fixtureAssetsDir, validator).handle())
          .toThrowError(ForbiddenError);
      });

      it('throws a ForbiddenError (array param)', () => {
        const req = { params: { path: ['..', 'secret.txt'] } };
        expect(() => new AssetsHandler(req, res, fixtureAssetsDir, validator).handle())
          .toThrowError(ForbiddenError);
      });
    });
  });
});
