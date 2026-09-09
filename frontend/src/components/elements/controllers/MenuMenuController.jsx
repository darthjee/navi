import MenuClient from '../../../clients/MenuClient.js';
import { loadExtensions } from '../../../extensions/loadExtensions.js';
import noop from '../../../utils/noop.js';

class MenuMenuController {
  static buildEffect(setEntries) {
    return () => {
      MenuMenuController.#loadEntries()
        .then(setEntries)
        .catch(noop);
    };
  }

  static buildOutsideClickHandler(containerRef, setOpen) {
    return (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
  }

  static buildOutsideClickEffect(open, containerRef, setOpen) {
    return () => {
      if (!open) return;

      const handler = MenuMenuController.buildOutsideClickHandler(containerRef, setOpen);
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    };
  }

  static async #loadEntries() {
    const [{ entries, hidden }, extensions] = await Promise.all([
      MenuClient.fetchEntries(),
      loadExtensions(),
    ]);

    const present = new Set(entries.map((e) => e.route));
    const hiddenSet = new Set(hidden);
    const extraEntries = extensions
      .map((d) => ({ route: d.path, text: d.text }))
      .filter((e) => !present.has(e.route) && !hiddenSet.has(e.route));

    return [...entries, ...extraEntries];
  }
}

export default MenuMenuController;
