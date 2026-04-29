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

  renderSingleUrl() {
    const url = this.#baseUrls[0];
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

  renderDropdownMenu() {
    return (
      <ul className="dropdown-menu show" style={this.menuStyle()}>
        {this.#baseUrls.map((url) => (
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
    );
  }

  renderDropdown(containerRef, open, setOpen) {
    return (
      <div ref={containerRef} className="dropdown d-inline-block">
        <button
          className="btn btn-sm btn-outline-secondary dropdown-toggle"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
        >
          Base URLs
        </button>
        {open && this.renderDropdownMenu()}
      </div>
    );
  }
}

export default BaseUrlsMenuHelper;
