import { useEffect, useRef, useState } from 'react';
import fetchBaseUrls from '../clients/BaseUrlsClient.js';

const MAX_VISIBLE = 10;

function BaseUrlsMenu() {
  const [baseUrls, setBaseUrls] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchBaseUrls()
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

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        Base URLs ▾
      </button>
      {open && (
        <div
          className="shadow border rounded bg-white"
          style={{
            position:  'absolute',
            top:       '100%',
            left:      0,
            zIndex:    1000,
            minWidth:  '200px',
            overflowY: baseUrls.length > MAX_VISIBLE ? 'auto' : 'visible',
            maxHeight: baseUrls.length > MAX_VISIBLE ? '20rem' : 'none',
          }}
        >
          {baseUrls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="d-block px-3 py-2 text-decoration-none text-dark"
              style={{ whiteSpace: 'nowrap' }}
            >
              {url}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default BaseUrlsMenu;
