import LinksClient from '../../../clients/LinksClient.js';
import noop from '../../../utils/noop.js';

class LinksMenuController {
  static buildEffect(setLinks) {
    return () => {
      LinksClient.fetchLinks()
        .then(setLinks)
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

      const handler = LinksMenuController.buildOutsideClickHandler(containerRef, setOpen);
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    };
  }
}

export default LinksMenuController;
