import MenuDropdownHelper from './helpers/MenuDropdownHelper.jsx';

function MenuDropdown({ containerRef, open, setOpen, entries }) {
  return (
    <div ref={containerRef} className="dropdown d-inline-block">
      <button
        className="btn btn-sm btn-outline-secondary dropdown-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        Menu
      </button>
      {open && MenuDropdownHelper.renderEntries(entries, { onNavigate: () => setOpen(false) })}
    </div>
  );
}

export default MenuDropdown;
