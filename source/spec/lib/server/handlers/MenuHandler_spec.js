import { HandlerConfig } from '../../../../lib/common/server/HandlerConfig.js';
import { RequestHandler } from '../../../../lib/common/server/RequestHandler.js';
import { MenuEntry } from '../../../../lib/models/configs/MenuEntry.js';
import { MenuHandler } from '../../../../lib/server/handlers/MenuHandler.js';

describe('MenuHandler', () => {
  let res;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
  });

  it('is an instance of RequestHandler', () => {
    expect(new MenuHandler({}, res, [])).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    describe('when entries are configured', () => {
      it('responds with serialized entries', () => {
        const entries = [
          new MenuEntry({ route: '/logs', text: 'Logs' }),
          new MenuEntry({ route: '/memory/status', text: 'Memory' }),
        ];

        new MenuHandler({}, res, entries).handle();

        expect(res.json).toHaveBeenCalledWith({
          entries: [
            { route: '/logs', text: 'Logs' },
            { route: '/memory/status', text: 'Memory' },
          ],
        });
      });
    });

    describe('when the entry list is empty', () => {
      it('responds with an empty list', () => {
        new MenuHandler({}, res, []).handle();

        expect(res.json).toHaveBeenCalledWith({ entries: [] });
      });
    });

    describe('when instantiated via HandlerConfig', () => {
      it('responds with the configured entries', () => {
        const entries = [new MenuEntry({ route: '/logs', text: 'Logs' })];

        new HandlerConfig(MenuHandler, [entries]).handle({}, res);

        expect(res.json).toHaveBeenCalledWith({ entries: [{ route: '/logs', text: 'Logs' }] });
      });
    });
  });
});
