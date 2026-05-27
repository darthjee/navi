import LinksDropdownItem from '../LinksDropdownItem.jsx';

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

export default LinksDropdownHelper;
