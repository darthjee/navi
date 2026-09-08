import { MenuEntry } from '../../../lib/models/configs/MenuEntry.js';
import { MenuSerializer } from '../../../lib/serializers/MenuSerializer.js';

describe('MenuSerializer', () => {
  describe('.serialize', () => {
    describe('when given a single entry', () => {
      it('returns a plain object with route and text', () => {
        const entry = new MenuEntry({ route: '/logs', text: 'Logs' });

        expect(MenuSerializer.serialize(entry)).toEqual({ route: '/logs', text: 'Logs' });
      });
    });

    describe('when given a list of entries', () => {
      it('returns an array of serialized entries', () => {
        const entries = [
          new MenuEntry({ route: '/logs' }),
          new MenuEntry({ route: '/memory/status', text: 'Memory' }),
        ];

        expect(MenuSerializer.serialize(entries)).toEqual([
          { route: '/logs', text: '/logs' },
          { route: '/memory/status', text: 'Memory' },
        ]);
      });
    });
  });
});
