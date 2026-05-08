class LinksMenuHelper {
  #links;

  constructor(links) {
    this.#links = links;
  }

  hasAny() {
    return this.#links.length > 0;
  }

  renderDropdown(containerRef, open, setOpen) {
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
            {this.#links.map(({ text, url }) => (
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
}

export default LinksMenuHelper;
