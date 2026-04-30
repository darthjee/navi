import { useEffect, useMemo, useRef, useState } from 'react';
import BaseUrlsMenuController from './controllers/BaseUrlsMenuController.jsx';
import BaseUrlsMenuHelper from './helpers/BaseUrlsMenuHelper.jsx';

function BaseUrlsMenu() {
  const [baseUrls, setBaseUrls] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const menu = useMemo(() => new BaseUrlsMenuHelper(baseUrls), [baseUrls]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(BaseUrlsMenuController.buildEffect(setBaseUrls), []);

  useEffect(() => {
    if (!open) return;

    const handler = BaseUrlsMenuController.buildOutsideClickHandler(containerRef, setOpen);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!menu.hasAny()) return null;

  if (menu.hasSingle()) return menu.renderSingleUrl();

  return menu.renderDropdown(containerRef, open, setOpen);
}

export default BaseUrlsMenu;

