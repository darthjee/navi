import path from 'path';
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
      it('sends the asset file from the assets directory', () => {
        handler.handle({ params: { path: 'app.js' } }, res);

        const [filePath] = res.sendFile.calls.mostRecent().args;
        expect(filePath).toContain(path.join('static', 'assets', 'app.js'));
      });
    });

    describe('when the path attempts directory traversal', () => {
      it('responds with 403', () => {
        handler.handle({ params: { path: '../secret.txt' } }, res);

        expect(res.status).toHaveBeenCalledWith(403);
      });

      it('responds with a Forbidden error', () => {
        const jsonSpy = jasmine.createSpy('json');
        res.status.and.returnValue({ json: jsonSpy });

        handler.handle({ params: { path: '../secret.txt' } }, res);

        expect(jsonSpy).toHaveBeenCalledWith({ error: 'Forbidden' });
      });
    });
  });
});
