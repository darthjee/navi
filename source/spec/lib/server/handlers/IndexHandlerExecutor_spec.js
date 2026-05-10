import path from 'path';
import { RequestHandler } from '../../../../lib/common/server/RequestHandler.js';
import { IndexHandlerExecutor } from '../../../../lib/server/handlers/IndexHandlerExecutor.js';

describe('IndexHandlerExecutor', () => {
  let res;

  beforeEach(() => {
    res = { sendFile: jasmine.createSpy('sendFile') };
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new IndexHandlerExecutor({}, res)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    it('sends index.html from the static directory', () => {
      new IndexHandlerExecutor({}, res).handle();

      const [filePath] = res.sendFile.calls.mostRecent().args;
      expect(path.basename(filePath)).toEqual('index.html');
      expect(filePath).toContain(path.join('static', 'index.html'));
    });
  });
});
