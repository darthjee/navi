import path from 'path';
import { RequestHandlerExecutor } from '../../../../lib/common/server/RequestHandlerExecutor.js';
import { ForbiddenError } from '../../../../lib/exceptions/http/ForbiddenError.js';
import { AssetsHandlerExecutor } from '../../../../lib/server/handlers/AssetsHandlerExecutor.js';
import { PathValidator } from '../../../../lib/server/PathValidator.js';

const fixtureAssetsDir = path.resolve('source/spec/support');

describe('AssetsHandlerExecutor', () => {
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
    const executor = new AssetsHandlerExecutor({}, res, fixtureAssetsDir, validator);
    expect(executor).toBeInstanceOf(RequestHandlerExecutor);
  });

  describe('#handle', () => {
    describe('when the path is valid', () => {
      it('sends the asset file (string param)', () => {
        const req = { params: { path: 'fixtures' } };
        new AssetsHandlerExecutor(req, res, fixtureAssetsDir, validator).handle();

        const [filePath] = res.sendFile.calls.mostRecent().args;
        expect(filePath).toContain(path.join(fixtureAssetsDir, 'fixtures'));
      });

      it('sends the asset file (array param)', () => {
        const req = { params: { path: ['fixtures'] } };
        new AssetsHandlerExecutor(req, res, fixtureAssetsDir, validator).handle();

        const [filePath] = res.sendFile.calls.mostRecent().args;
        expect(filePath).toContain(path.join(fixtureAssetsDir, 'fixtures'));
      });
    });

    describe('when the path attempts directory traversal', () => {
      it('throws a ForbiddenError (string param)', () => {
        const req = { params: { path: '../secret.txt' } };
        expect(() => new AssetsHandlerExecutor(req, res, fixtureAssetsDir, validator).handle())
          .toThrowError(ForbiddenError);
      });

      it('throws a ForbiddenError (array param)', () => {
        const req = { params: { path: ['..', 'secret.txt'] } };
        expect(() => new AssetsHandlerExecutor(req, res, fixtureAssetsDir, validator).handle())
          .toThrowError(ForbiddenError);
      });
    });
  });
});
