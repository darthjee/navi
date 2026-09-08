import MenuDropdown from '../MenuDropdown.jsx';

class MenuMenuHelper {
  #entries;

  constructor(entries) {
    this.#entries = entries;
  }

  hasAny() {
    return this.#entries.length > 0;
  }

  renderDropdown(containerRef, open, setOpen) {
    return (
      <MenuDropdown
        containerRef={containerRef}
        open={open}
        setOpen={setOpen}
        entries={this.#entries}
      />
    );
  }
}

export default MenuMenuHelper;
