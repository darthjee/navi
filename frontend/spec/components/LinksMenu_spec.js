import { createElement } from 'react';
import { act } from 'react';
import LinksMenu from '../../src/components/elements/LinksMenu.jsx';
import { useContainer } from '../support/dom.js';
import { itBehavesLikeFetchedMenu } from '../support/fetched_menu.js';

const links = [
  { text: 'Home', url: 'https://example.com' },
  { text: 'Docs', url: 'https://example.com/docs' },
];

describe('LinksMenu', () => {
  const state = useContainer();

  const render = async () => {
    await act(async () => {
      state.root.render(createElement(LinksMenu));
    });
  };

  itBehavesLikeFetchedMenu({ state, render, label: 'Links', dataKey: 'links', items: links });
});
