import { MenuEntry } from '../../../../lib/models/configs/MenuEntry.js';

describe('MenuEntry', () => {
  describe('constructor', () => {
    describe('when text is provided', () => {
      it('stores route and text', () => {
        const entry = new MenuEntry({ route: '/logs', text: 'Logs' });
        expect(entry.route).toEqual('/logs');
        expect(entry.text).toEqual('Logs');
      });
    });

    describe('when text is omitted', () => {
      it('defaults text to route', () => {
        const entry = new MenuEntry({ route: '/logs' });
        expect(entry.text).toEqual('/logs');
      });
    });
  });

  describe('.fromObject', () => {
    it('builds a MenuEntry from a mapping', () => {
      const entry = MenuEntry.fromObject({ route: '/memory/status', text: 'Memory' });
      expect(entry).toBeInstanceOf(MenuEntry);
      expect(entry.route).toEqual('/memory/status');
      expect(entry.text).toEqual('Memory');
    });

    it('defaults text to route when omitted', () => {
      const entry = MenuEntry.fromObject({ route: '/logs' });
      expect(entry.text).toEqual('/logs');
    });
  });

  describe('#toJSON', () => {
    it('returns route and text only', () => {
      const entry = new MenuEntry({ route: '/logs', text: 'Logs' });
      expect(entry.toJSON()).toEqual({ route: '/logs', text: 'Logs' });
    });

    it('never serializes hidden', () => {
      const entry = MenuEntry.fromObject({ route: '/logs', text: 'Logs', hidden: true });
      expect(entry.toJSON()).toEqual({ route: '/logs', text: 'Logs' });
    });
  });

  describe('.validate', () => {
    describe('when the entry is a valid internal route', () => {
      it('is valid', () => {
        expect(MenuEntry.validate({ route: '/logs', text: 'Logs' })).toEqual({ valid: true, reason: undefined });
      });
    });

    describe('when the entry is a valid external URL', () => {
      it('is valid', () => {
        expect(MenuEntry.isValid({ route: 'https://example.com', text: 'Home' })).toBe(true);
      });
    });

    describe('when text is omitted', () => {
      it('is valid', () => {
        expect(MenuEntry.isValid({ route: '/logs' })).toBe(true);
      });
    });

    describe('when hidden is a boolean', () => {
      it('is valid', () => {
        expect(MenuEntry.isValid({ route: '/logs', hidden: true })).toBe(true);
      });
    });

    describe('when route is missing', () => {
      it('is invalid', () => {
        const { valid, reason } = MenuEntry.validate({ text: 'Logs' });
        expect(valid).toBe(false);
        expect(reason).toContain('route');
      });
    });

    describe('when route is empty', () => {
      it('is invalid', () => {
        expect(MenuEntry.isValid({ route: '' })).toBe(false);
      });
    });

    describe('when route contains whitespace', () => {
      it('is invalid', () => {
        const { valid, reason } = MenuEntry.validate({ route: '/log s' });
        expect(valid).toBe(false);
        expect(reason).toContain('whitespace');
      });
    });

    describe('when route is neither a path nor an http(s) URL', () => {
      it('is invalid', () => {
        const { valid, reason } = MenuEntry.validate({ route: 'logs' });
        expect(valid).toBe(false);
        expect(reason).toContain('^https?://');
      });
    });

    describe('when text is an empty string', () => {
      it('is invalid', () => {
        expect(MenuEntry.isValid({ route: '/logs', text: '' })).toBe(false);
      });
    });

    describe('when hidden is not a boolean', () => {
      it('is invalid', () => {
        const { valid, reason } = MenuEntry.validate({ route: '/logs', hidden: 'yes' });
        expect(valid).toBe(false);
        expect(reason).toContain('hidden');
      });
    });

    describe('when there is an unknown key', () => {
      it('is invalid', () => {
        const { valid, reason } = MenuEntry.validate({ route: '/logs', icon: 'gear' });
        expect(valid).toBe(false);
        expect(reason).toContain('unknown key');
      });
    });

    describe('when the entry is not a mapping', () => {
      it('is invalid', () => {
        expect(MenuEntry.isValid('/logs')).toBe(false);
      });
    });
  });
});
