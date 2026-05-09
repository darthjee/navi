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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(LinksMenuController.buildOutsideClickEffect(open, containerRef, setOpen), [open]);

  if (!menu.hasAny()) return null;

  return menu.renderDropdown(containerRef, open, setOpen);
}

export default LinksMenu;
