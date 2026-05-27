import LinksDropdownItem from './LinksDropdownItem.jsx';

class LinksDropdownHelper {
  static renderLinks(links) {
    return (
      <ul className="dropdown-menu show">
        {links.map(({ text, url }) => (
          <LinksDropdownItem key={`${text}-${url}`} text={text} url={url} />
        ))}
      </ul>
    );
  }
}

function LinksDropdown({ containerRef, open, setOpen, links }) {
  return (
    <div ref={containerRef} className="dropdown d-inline-block">
      <button
        className="btn btn-sm btn-outline-secondary dropdown-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        Links
      </button>
      {open && LinksDropdownHelper.renderLinks(links)}
    </div>
  );
}

export default LinksDropdown;
