import { act } from 'react';

// Registers the scenarios shared by the dropdown components (MenuDropdown and
// LinksDropdown). Call at describe level. `render(open)` is an async function
// that renders the component under test into the container held by `state`
// (from useContainer()) with the given `open` flag and resolves to the
// `setOpen` spy. `items` are the entries handed to the component (each with a
// `text` property) and `label` is the text shown on the toggle button.
const itBehavesLikeDropdown = ({ state, label, items, render }) => {
  const button = () => state.container.querySelector('button');

  describe('when closed', () => {
    beforeEach(async () => { await render(false); });

    it('renders the toggle button', () => {
      expect(button()).not.toBeNull();
    });

    it(`shows "${label}" on the button`, () => {
      expect(button().textContent).toContain(label);
    });

    it('does not show any items', () => {
      expect(state.container.querySelectorAll('a').length).toBe(0);
    });

    it('sets aria-expanded to false', () => {
      expect(button().getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('when open', () => {
    beforeEach(async () => { await render(true); });

    it('shows all items', () => {
      expect(state.container.querySelectorAll('a').length).toBe(items.length);
    });

    it('shows the item text', () => {
      items.forEach(({ text }) => {
        expect(state.container.textContent).toContain(text);
      });
    });

    it('sets aria-expanded to true', () => {
      expect(button().getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('when the toggle button is clicked', () => {
    let setOpen;

    beforeEach(async () => {
      setOpen = await render(false);
      await act(async () => { button().click(); });
    });

    it('calls setOpen', () => {
      expect(setOpen).toHaveBeenCalled();
    });
  });
};

export { itBehavesLikeDropdown };
