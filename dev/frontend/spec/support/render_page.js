import { renderInAct } from 'navi-spec-support/dom.js';
import { createElement } from 'react';
import { act } from 'react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';

// Builds the render/navigate helpers shared by the page specs.
//
// `state` is the object returned by `useContainer()`. `route` is the route
// pattern the page is mounted on (defaults to a catch-all, for pages that read
// no route params), `element` is the page element and `defaultPath` the
// location rendered when `render` is called without arguments.
const createPageRenderer = (state, { route = '*', element, defaultPath }) => {
  let navigateFn;

  const NavigationCapture = () => {
    navigateFn = useNavigate();
    return null;
  };

  const render = async (path = defaultPath) => {
    await renderInAct(
      state.root,
      createElement(MemoryRouter, { initialEntries: [path] },
        createElement(NavigationCapture),
        createElement(Routes, null,
          createElement(Route, { path: route, element })
        )
      )
    );
  };

  const navigate = async (to) => {
    await act(async () => { navigateFn(to); });
  };

  return { render, navigate };
};

export default createPageRenderer;
