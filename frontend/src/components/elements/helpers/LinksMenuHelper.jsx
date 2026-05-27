import LinksDropdown from '../LinksDropdown.jsx';

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
      <LinksDropdown
        containerRef={containerRef}
        open={open}
        setOpen={setOpen}
        links={this.#links}
      />
    );
  }
}

export default LinksMenuHelper;
