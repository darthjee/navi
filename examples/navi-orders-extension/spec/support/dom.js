import { JSDOM } from 'jsdom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
});

const globals = {
  window,
  document: window.document,
  HTMLElement: window.HTMLElement,
  Element: window.Element,
  Node: window.Node,
  NodeList: window.NodeList,
  DocumentFragment: window.DocumentFragment,
  MutationObserver: window.MutationObserver,
  Event: window.Event,
  CustomEvent: window.CustomEvent,
  requestAnimationFrame: window.requestAnimationFrame,
  cancelAnimationFrame: window.cancelAnimationFrame,
  IS_REACT_ACT_ENVIRONMENT: true,
};

for (const [key, value] of Object.entries(globals)) {
  const desc = Object.getOwnPropertyDescriptor(globalThis, key);
  if (desc && !desc.writable && !desc.set) {
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  } else {
    globalThis[key] = value;
  }
}

// Creates a DOM container and React root for component specs.
// Call at describe level; access container and root via the returned state object.
const useContainer = () => {
  const state = {};

  beforeEach(() => {
    state.container = document.createElement('div');
    document.body.appendChild(state.container);
    state.root = createRoot(state.container);
  });

  afterEach(async () => {
    await act(async () => { state.root.unmount(); });
    document.body.removeChild(state.container);
  });

  return state;
};

export { useContainer };
