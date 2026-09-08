import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Logger } from '../../../../lib/common/utils/logging/Logger.js';
import { MenuConfigurationInvalid } from '../../../../lib/exceptions/config/MenuConfigurationInvalid.js';
import { MenuConfig } from '../../../../lib/models/configs/MenuConfig.js';
import { MenuEntry } from '../../../../lib/models/configs/MenuEntry.js';

describe('MenuConfig', () => {
  let dir;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'menu-config-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const write = (content) => {
    const path = join(dir, 'menu.yml');
    writeFileSync(path, content, 'utf8');
    return path;
  };

  describe('.DEFAULT_ENTRIES', () => {
    it('is the Logs + Memory menu', () => {
      expect(MenuConfig.DEFAULT_ENTRIES.map((entry) => entry.toJSON())).toEqual([
        { route: '/logs', text: 'Logs' },
        { route: '/memory/status', text: 'Memory' },
      ]);
    });
  });

  describe('.fromFile', () => {
    describe('when the file does not exist', () => {
      it('returns the default entries', () => {
        const entries = MenuConfig.fromFile(join(dir, 'missing.yml'));
        expect(entries.map((entry) => entry.toJSON())).toEqual([
          { route: '/logs', text: 'Logs' },
          { route: '/memory/status', text: 'Memory' },
        ]);
      });
    });

    describe('when the file is empty', () => {
      it('returns the default entries', () => {
        const entries = MenuConfig.fromFile(write(''));
        expect(entries.length).toBe(2);
      });
    });

    describe('when the file is whitespace-only', () => {
      it('returns the default entries', () => {
        const entries = MenuConfig.fromFile(write('   \n  \n'));
        expect(entries.length).toBe(2);
      });
    });

    describe('when the document has no entries key', () => {
      it('returns the default entries', () => {
        const entries = MenuConfig.fromFile(write('other: value\n'));
        expect(entries.length).toBe(2);
      });
    });

    describe('when entries is an explicit empty list', () => {
      it('returns an empty menu', () => {
        expect(MenuConfig.fromFile(write('entries: []\n'))).toEqual([]);
      });
    });

    describe('when entries lists valid mappings', () => {
      it('returns MenuEntry instances in file order', () => {
        const path = write([
          'entries:',
          '  - route: /custom',
          '    text: Custom',
          '  - route: /logs',
        ].join('\n'));

        const entries = MenuConfig.fromFile(path);

        expect(entries[0]).toBeInstanceOf(MenuEntry);
        expect(entries.map((entry) => entry.toJSON())).toEqual([
          { route: '/custom', text: 'Custom' },
          { route: '/logs', text: '/logs' },
        ]);
      });
    });

    describe('when one entry is malformed among valid ones', () => {
      it('drops it and warns', () => {
        spyOn(Logger, 'warn').and.stub();
        const path = write([
          'entries:',
          '  - route: /logs',
          '    text: Logs',
          '  - route: bad route',
          '  - route: /memory/status',
        ].join('\n'));

        const entries = MenuConfig.fromFile(path);

        expect(entries.map((entry) => entry.route)).toEqual(['/logs', '/memory/status']);
        expect(Logger.warn).toHaveBeenCalledWith(jasmine.stringMatching(/\[menu\] skipping invalid entry at index 1/));
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
      it('interpolates it before parsing', () => {
        process.env.MENU_SPEC_TEXT = 'Interpolated';
        const path = write([
          'entries:',
          '  - route: /logs',
          '    text: ${MENU_SPEC_TEXT}',
        ].join('\n'));

        try {
          const entries = MenuConfig.fromFile(path);
          expect(entries[0].text).toEqual('Interpolated');
        } finally {
          delete process.env.MENU_SPEC_TEXT;
        }
      });
    });
  });
});
