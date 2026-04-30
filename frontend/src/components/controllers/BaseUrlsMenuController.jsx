import BaseUrlsClient from '../../clients/BaseUrlsClient.js';
import noop from '../../utils/noop.js';

class BaseUrlsMenuController {
  static buildEffect(setBaseUrls) {
    return () => {
      BaseUrlsClient.fetchBaseUrls()
        .then(setBaseUrls)
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
}

export default BaseUrlsMenuController;
