import { createElement } from 'react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import MenuDropdown from '../../src/components/elements/MenuDropdown.jsx';
import { useContainer } from '../support/dom.js';

const entries = [
  { text: 'Logs', route: '/logs' },
  { text: 'Docs', route: 'https://example.com/docs' },
];

describe('MenuDropdown', () => {
  const state = useContainer();

  const render = async (open) => {
    const setOpen = jasmine.createSpy('setOpen');
    const containerRef = { current: null };
    await act(async () => {
      state.root.render(
        createElement(
          MemoryRouter,
          null,
          createElement(MenuDropdown, { containerRef, open, setOpen, entries })
        )
      );
    });
    return setOpen;
  };

  describe('when closed', () => {
    beforeEach(async () => { await render(false); });

    it('renders the toggle button', () => {
      expect(state.container.querySelector('button')).not.toBeNull();
    });

    it('shows "Menu" on the button', () => {
      expect(state.container.querySelector('button').textContent).toContain('Menu');
    });

    it('does not show any entries', () => {
      expect(state.container.querySelectorAll('a').length).toBe(0);
    });

    it('sets aria-expanded to false', () => {
      expect(state.container.querySelector('button').getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('when open', () => {
    beforeEach(async () => { await render(true); });

    it('shows all entry items', () => {
      expect(state.container.querySelectorAll('a').length).toBe(2);
    });

    it('shows the entry text', () => {
      expect(state.container.textContent).toContain('Logs');
      expect(state.container.textContent).toContain('Docs');
    });

    it('sets aria-expanded to true', () => {
      expect(state.container.querySelector('button').getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('when the toggle button is clicked', () => {
    let setOpen;

    beforeEach(async () => {
      setOpen = await render(false);
      await act(async () => {
        state.container.querySelector('button').click();
      });
    });

    it('calls setOpen', () => {
      expect(setOpen).toHaveBeenCalled();
    });
  });
});
