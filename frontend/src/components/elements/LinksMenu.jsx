import { useEffect, useMemo, useRef, useState } from 'react';
import LinksMenuHelper from './helpers/LinksMenuHelper.jsx';
import LinksClient from '../../clients/LinksClient.js';
import noop from '../../utils/noop.js';

function LinksMenu() {
  const [links, setLinks] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const menu = useMemo(() => new LinksMenuHelper(links), [links]);

  useEffect(() => {
    LinksClient.fetchLinks()
      .then(setLinks)
      .catch(noop);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!menu.hasAny()) return null;

  return menu.renderDropdown(containerRef, open, setOpen);
}

export default LinksMenu;
