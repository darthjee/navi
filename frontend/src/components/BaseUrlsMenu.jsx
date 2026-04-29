import { useEffect, useMemo, useRef, useState } from 'react';
import BaseUrlsClient from '../clients/BaseUrlsClient.js';
import noop from '../utils/noop.js';

const MAX_VISIBLE = 10;

class BaseUrlsMenuHelper {
  #baseUrls;

  constructor(baseUrls) {
    this.#baseUrls = baseUrls;
  }

  hasAny() {
    return this.#baseUrls.length > 0;
  }

  hasSingle() {
    return this.#baseUrls.length === 1;
  }

  menuStyle() {
    return this.#baseUrls.length > MAX_VISIBLE
      ? { overflowY: 'auto', maxHeight: '20rem' }
      : {};
  }

  buildOutsideClickHandler(containerRef, setOpen) {
    return (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
  }

  first() {
    return this.#baseUrls[0];
  }

  all() {
    return this.#baseUrls;
  }
}

function SingleUrlLink({ url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="btn btn-sm btn-outline-secondary"
    >
      {url}
    </a>
  );
}

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

  if (menu.hasSingle()) {
    return <SingleUrlLink url={menu.first()} />;
  }

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
        <ul className="dropdown-menu show" style={menu.menuStyle()}>
          {menu.all().map((url) => (
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

