import path from 'path';
import { RequestHandler } from '../../../lib/common/server/RequestHandler.js';
import IndexHandler from '../../../lib/handlers/IndexHandler.js';

describe('IndexHandler', () => {
  let res;

  beforeEach(() => {
    res = { sendFile: jasmine.createSpy('sendFile') };
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new IndexHandler({}, res)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    it('sends index.html from the static directory', () => {
      new IndexHandler({}, res).handle();

      const [filePath] = res.sendFile.calls.mostRecent().args;
      expect(path.basename(filePath)).toEqual('index.html');
      expect(filePath).toContain(path.join('static', 'index.html'));
    });
  });
});
