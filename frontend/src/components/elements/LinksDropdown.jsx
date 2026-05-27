import LinksDropdownHelper from './helpers/LinksDropdownHelper.jsx';

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
