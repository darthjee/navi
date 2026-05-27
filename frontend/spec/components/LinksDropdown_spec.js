import { createElement } from 'react';
import { act } from 'react';
import LinksDropdown from '../../src/components/elements/LinksDropdown.jsx';
import { useContainer } from '../support/dom.js';

const links = [
  { text: 'Home', url: 'https://example.com' },
  { text: 'Docs', url: 'https://example.com/docs' },
];

describe('LinksDropdown', () => {
  const state = useContainer();

  const render = async (open) => {
    const setOpen = jasmine.createSpy('setOpen');
    const containerRef = { current: null };
    await act(async () => {
      state.root.render(
        createElement(LinksDropdown, { containerRef, open, setOpen, links })
      );
    });
    return setOpen;
  };

  describe('when closed', () => {
    beforeEach(async () => { await render(false); });

    it('renders the toggle button', () => {
      expect(state.container.querySelector('button')).not.toBeNull();
    });

    it('shows "Links" on the button', () => {
      expect(state.container.querySelector('button').textContent).toContain('Links');
    });

    it('does not show any links', () => {
      expect(state.container.querySelectorAll('a').length).toBe(0);
    });

    it('sets aria-expanded to false', () => {
      expect(state.container.querySelector('button').getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('when open', () => {
    beforeEach(async () => { await render(true); });

    it('shows all link items', () => {
      expect(state.container.querySelectorAll('a').length).toBe(2);
    });

    it('shows the link text', () => {
      expect(state.container.textContent).toContain('Home');
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
