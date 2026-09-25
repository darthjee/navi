import { Logger } from 'deku-sprout';
import { MenuConfigurationInvalid } from '../../../../lib/exceptions/config/MenuConfigurationInvalid.js';
import { MenuConfig } from '../../../../lib/models/configs/MenuConfig.js';
import { MenuEntry } from '../../../../lib/models/configs/MenuEntry.js';
import { MenuConfigFileUtils } from '../../../support/utils/MenuConfigFileUtils.js';

const { LOGS, MEMORY } = MenuConfigFileUtils;
const rendered = (path) => MenuConfigFileUtils.rendered(path);

describe('MenuConfig', () => {
  const { path: tempPath, write } = MenuConfigFileUtils.useTempDir();

  describe('.DEFAULT_ENTRIES', () => {
    it('is the Logs + Memory menu', () => {
      expect(MenuConfig.DEFAULT_ENTRIES.map((entry) => entry.toJSON())).toEqual([LOGS, MEMORY]);
    });
  });

  describe('.DEFAULT_ROUTES', () => {
    it('lists the known default routes in shipped order', () => {
      expect(MenuConfig.DEFAULT_ROUTES).toEqual(['/logs', '/memory/status']);
    });
  });

  describe('.defaultLabel', () => {
    it('maps a known default route to its shipped label', () => {
      expect(MenuConfig.defaultLabel('/logs')).toEqual('Logs');
      expect(MenuConfig.defaultLabel('/memory/status')).toEqual('Memory');
    });

    it('returns undefined for a non-default route', () => {
      expect(MenuConfig.defaultLabel('/dashboard')).toBeUndefined();
    });
  });

  describe('.fromFile', () => {
    [
      { description: 'the file does not exist', path: () => tempPath('missing.yml') },
      { description: 'the file is empty', content: '' },
      { description: 'the file is whitespace-only', content: '   \n  \n' },
      { description: 'the file is fully commented out', content: ['# entries:', '#   - route: /dashboard'] },
      { description: 'the document carries neither entries nor defaults', content: 'other: value\n' },
      { description: 'entries is an explicit empty list', content: 'entries: []\n' },
    ].forEach(({ description, path, content }) => {
      describe(`when ${description}`, () => {
        it('returns the default entries', () => {
          const file = path ? path() : write(content);

          expect(rendered(file)).toEqual([LOGS, MEMORY]);
        });
      });
    });

    describe('when entries lists custom mappings', () => {
      it('renders them after the defaults, in file order', () => {
        const path = write([
          'entries:',
          '  - route: /alpha',
          '    text: Alpha',
          '  - route: /beta',
          '    text: Beta',
        ]);

        expect(MenuConfig.fromFile(path)[0]).toBeInstanceOf(MenuEntry);
        expect(rendered(path)).toEqual([
          LOGS,
          MEMORY,
          { route: '/alpha', text: 'Alpha' },
          { route: '/beta', text: 'Beta' },
        ]);
      });
    });

    describe('when defaults is false', () => {
      it('renders only the operator entries', () => {
        const path = write([
          'defaults: false',
          'entries:',
          '  - route: /alpha',
          '    text: Alpha',
        ]);

        expect(rendered(path)).toEqual([{ route: '/alpha', text: 'Alpha' }]);
      });

      it('renders an empty menu when there is no entries key', () => {
        expect(MenuConfig.fromFile(write('defaults: false\n'))).toEqual([]);
      });
    });

    describe('when defaults is not a boolean', () => {
      it('warns and behaves as true', () => {
        spyOn(Logger, 'warn').and.stub();

        const path = write(['defaults: maybe', 'entries: []']);

        expect(rendered(path)).toEqual([LOGS, MEMORY]);
        expect(Logger.warn).toHaveBeenCalledWith(
          '[menu] ignoring non-boolean "defaults" value; treating as true',
        );
      });
    });

    describe('when the YAML cannot be parsed', () => {
      it('throws MenuConfigurationInvalid', () => {
        const path = write('entries: [ unterminated\n');
        expect(() => MenuConfig.fromFile(path)).toThrowError(MenuConfigurationInvalid);
      });
    });

    describe('when entries is present but not a list', () => {
      it('throws MenuConfigurationInvalid', () => {
        const path = write('entries:\n  route: /logs\n');
        expect(() => MenuConfig.fromFile(path)).toThrowError(MenuConfigurationInvalid);
      });
    });

    describe('when the file references an environment variable', () => {
      it('interpolates it before parsing, alongside defaults', () => {
        process.env.MENU_SPEC_TEXT = 'Interpolated';
        const path = write([
          'defaults: true',
          'entries:',
          '  - route: /alpha',
          '    text: ${MENU_SPEC_TEXT}',
        ]);

        try {
          expect(rendered(path)).toEqual([
            LOGS,
            MEMORY,
            { route: '/alpha', text: 'Interpolated' },
          ]);
        } finally {
          delete process.env.MENU_SPEC_TEXT;
        }
      });
    });
  });
});
