import { useEffect, useMemo, useRef, useState } from 'react';
import MenuMenuController from './controllers/MenuMenuController.jsx';
import MenuMenuHelper from './helpers/MenuMenuHelper.jsx';

function MenuMenu() {
  const [entries, setEntries] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const menu = useMemo(() => new MenuMenuHelper(entries), [entries]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(MenuMenuController.buildEffect(setEntries), []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(MenuMenuController.buildOutsideClickEffect(open, containerRef, setOpen), [open]);

  if (!menu.hasAny()) return null;

  return menu.renderDropdown(containerRef, open, setOpen);
}

export default MenuMenu;
