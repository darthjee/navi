import { useEffect, useRef, useState } from 'react';
import LinksClient from '../../clients/LinksClient.js';
import noop from '../../utils/noop.js';

function LinksMenu() {
  const [links, setLinks] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

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

  if (links.length === 0) return null;

  return (
    <div ref={containerRef} className="dropdown d-inline-block">
      <button
        className="btn btn-sm btn-outline-secondary dropdown-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        Links
      </button>
      {open && (
        <ul className="dropdown-menu show">
          {links.map(({ text, url }) => (
            <li key={`${text}-${url}`}>
              <a href={url} target="_blank" rel="noreferrer" className="dropdown-item">
                {text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default LinksMenu;
