import MenuClient from '../../../clients/MenuClient.js';
import noop from '../../../utils/noop.js';

class MenuMenuController {
  static buildEffect(setEntries) {
    return () => {
      MenuClient.fetchEntries()
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
}

export default MenuMenuController;
