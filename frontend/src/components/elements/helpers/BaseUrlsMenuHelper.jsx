import DropdownMenu from '../DropdownMenu.jsx';
import DropdownMenuContent from '../DropdownMenuContent.jsx';
import SingleUrlLink from '../SingleUrlLink.jsx';

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

  renderSingleUrl() {
    return <SingleUrlLink url={this.#baseUrls[0]} />;
  }

  renderDropdownMenu() {
    return <DropdownMenuContent baseUrls={this.#baseUrls} menuStyle={this.menuStyle()} />;
  }

  renderDropdown(containerRef, open, setOpen) {
    return (
      <DropdownMenu
        containerRef={containerRef}
        open={open}
        setOpen={setOpen}
        baseUrls={this.#baseUrls}
        menuStyle={this.menuStyle()}
      />
    );
  }
}

export default BaseUrlsMenuHelper;
