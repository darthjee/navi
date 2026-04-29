import { useEffect, useRef, useState } from 'react';
import BaseUrlsClient from '../clients/BaseUrlsClient.js';

const MAX_VISIBLE = 10;

function BaseUrlsMenu() {
  const [baseUrls, setBaseUrls] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    BaseUrlsClient.fetchBaseUrls()
      .then(setBaseUrls)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  if (baseUrls.length === 0) return null;

  if (baseUrls.length === 1) {
    return (
      <a
        href={baseUrls[0]}
        target="_blank"
        rel="noreferrer"
        className="btn btn-sm btn-outline-secondary"
      >
        {baseUrls[0]}
      </a>
    );
  }

  const menuStyle = baseUrls.length > MAX_VISIBLE
    ? { overflowY: 'auto', maxHeight: '20rem' }
    : {};

  return (
    <div ref={containerRef} className="dropdown d-inline-block">
      <button
        className="btn btn-sm btn-outline-secondary dropdown-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        Base URLs
      </button>
      {open && (
        <ul className="dropdown-menu show" style={menuStyle}>
          {baseUrls.map((url) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="dropdown-item"
              >
                {url}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BaseUrlsMenu;
