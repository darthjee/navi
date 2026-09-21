import { useContainer } from 'navi-spec-support/dom.js';
import { createElement } from 'react';
import { act } from 'react';
import LinksDropdown from '../../src/components/elements/LinksDropdown.jsx';
import { itBehavesLikeDropdown } from '../support/dropdown.js';

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

  itBehavesLikeDropdown({ state, label: 'Links', items: links, render });
});
