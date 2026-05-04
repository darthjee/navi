import DropdownMenuContent from './DropdownMenuContent.jsx';

function DropdownMenu({ containerRef, open, setOpen, baseUrls, menuStyle }) {
  return (
    <div ref={containerRef} className="dropdown d-inline-block">
      <button
        className="btn btn-sm btn-outline-secondary dropdown-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        Base URLs
      </button>
      {open && <DropdownMenuContent baseUrls={baseUrls} menuStyle={menuStyle} />}
    </div>
  );
}

export default DropdownMenu;
