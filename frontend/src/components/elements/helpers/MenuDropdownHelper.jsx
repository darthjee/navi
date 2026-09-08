import MenuDropdownItem from '../MenuDropdownItem.jsx';

class MenuDropdownHelper {
  static renderEntries(entries, { onNavigate } = {}) {
    return (
      <ul className="dropdown-menu show">
        {entries.map(({ route, text }) => (
          <MenuDropdownItem key={route} route={route} text={text} onNavigate={onNavigate} />
        ))}
      </ul>
    );
  }
}

export default MenuDropdownHelper;
