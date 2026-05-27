import LinksDropdownItem from './LinksDropdownItem.jsx';

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
      {open && (
        <ul className="dropdown-menu show">
          {links.map(({ text, url }) => (
            <LinksDropdownItem key={`${text}-${url}`} text={text} url={url} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default LinksDropdown;
