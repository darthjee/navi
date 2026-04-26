import path from 'path';
import { ForbiddenError } from '../../../lib/exceptions/ForbiddenError.js';
import { AssetsRequestHandler } from '../../../lib/server/AssetsRequestHandler.js';

describe('AssetsRequestHandler', () => {
  let handler;
  let res;

  beforeEach(() => {
    res = {
      sendFile: jasmine.createSpy('sendFile'),
      status:   jasmine.createSpy('status').and.returnValue({ json: jasmine.createSpy('json') }),
    };
    handler = new AssetsRequestHandler();
  });

  describe('#handle', () => {
    describe('when the path is valid', () => {
      it('sends the asset file from the assets directory (string param)', () => {
        handler.handle({ params: { path: 'app.js' } }, res);

        const [filePath] = res.sendFile.calls.mostRecent().args;
        expect(filePath).toContain(path.join('static', 'assets', 'app.js'));
      });

      it('sends the asset file from the assets directory (Express 5 array param)', () => {
        handler.handle({ params: { path: ['app.js'] } }, res);

        const [filePath] = res.sendFile.calls.mostRecent().args;
        expect(filePath).toContain(path.join('static', 'assets', 'app.js'));
      });

      it('sends a nested asset file (Express 5 array param with segments)', () => {
        handler.handle({ params: { path: ['sub', 'app.js'] } }, res);

        const [filePath] = res.sendFile.calls.mostRecent().args;
        expect(filePath).toContain(path.join('static', 'assets', 'sub', 'app.js'));
      });
    });

    describe('when the path attempts directory traversal', () => {
      it('throws a ForbiddenError (string param)', () => {
        expect(() => handler.handle({ params: { path: '../secret.txt' } }, res))
          .toThrowError(ForbiddenError);
      });

      it('throws a ForbiddenError (Express 5 array param)', () => {
        expect(() => handler.handle({ params: { path: ['..', 'secret.txt'] } }, res))
          .toThrowError(ForbiddenError);
      });
    });
  });
});
