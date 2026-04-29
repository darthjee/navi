import { useEffect, useMemo, useRef, useState } from 'react';
import BaseUrlsMenuHelper from './BaseUrlsMenuHelper.jsx';
import BaseUrlsClient from '../clients/BaseUrlsClient.js';
import noop from '../utils/noop.js';

function BaseUrlsMenu() {
  const [baseUrls, setBaseUrls] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const menu = useMemo(() => new BaseUrlsMenuHelper(baseUrls), [baseUrls]);

  useEffect(() => {
    BaseUrlsClient.fetchBaseUrls()
      .then(setBaseUrls)
      .catch(noop);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handler = menu.buildOutsideClickHandler(containerRef, setOpen);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, menu]);

  if (!menu.hasAny()) return null;

  if (menu.hasSingle()) return menu.renderSingleUrl();

  return menu.renderDropdown(containerRef, open, setOpen);
}

export default BaseUrlsMenu;

