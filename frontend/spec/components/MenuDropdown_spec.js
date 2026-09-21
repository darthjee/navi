import { createElement } from 'react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import MenuDropdown from '../../src/components/elements/MenuDropdown.jsx';
import { useContainer } from '../support/dom.js';
import { itBehavesLikeDropdown } from '../support/dropdown.js';

const entries = [
  { text: 'Logs', route: '/logs' },
  { text: 'Docs', route: 'https://example.com/docs' },
];

describe('MenuDropdown', () => {
  const state = useContainer();

  const render = async (open, entryList = entries) => {
    const setOpen = jasmine.createSpy('setOpen');
    const containerRef = { current: null };
    await act(async () => {
      state.root.render(
        createElement(
          MemoryRouter,
          null,
          createElement(MenuDropdown, { containerRef, open, setOpen, entries: entryList })
        )
      );
    });
    return setOpen;
  };

  itBehavesLikeDropdown({ state, label: 'Menu', items: entries, render });

  describe('when open', () => {
    beforeEach(async () => { await render(true); });

    it('adds the scroll hook class to the panel', () => {
      expect(state.container.querySelector('ul').classList.contains('menu-dropdown-panel')).toBe(true);
    });
  });

  describe('when open with many entries', () => {
    const manyEntries = Array.from({ length: 25 }, (_, index) => ({
      text: `Entry ${index}`,
      route: `/entry-${index}`,
    }));

    beforeEach(async () => { await render(true, manyEntries); });

    it('renders every entry without a client-side cap', () => {
      expect(state.container.querySelectorAll('a').length).toBe(manyEntries.length);
    });

    it('keeps the scroll hook class on the panel', () => {
      expect(state.container.querySelector('ul').classList.contains('menu-dropdown-panel')).toBe(true);
    });
  });
});
