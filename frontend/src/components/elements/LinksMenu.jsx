import { useEffect, useMemo, useRef, useState } from 'react';
import LinksMenuController from './controllers/LinksMenuController.jsx';
import LinksMenuHelper from './helpers/LinksMenuHelper.jsx';

function LinksMenu() {
  const [links, setLinks] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const menu = useMemo(() => new LinksMenuHelper(links), [links]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(LinksMenuController.buildEffect(setLinks), []);

  useEffect(() => {
    if (!open) return;

    const handler = LinksMenuController.buildOutsideClickHandler(containerRef, setOpen);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!menu.hasAny()) return null;

  return menu.renderDropdown(containerRef, open, setOpen);
}

export default LinksMenu;
