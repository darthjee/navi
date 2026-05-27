function LinksDropdownItem({ text, url }) {
  return (
    <li>
      <a href={url} target="_blank" rel="noreferrer" className="dropdown-item">
        {text}
      </a>
    </li>
  );
}

export default LinksDropdownItem;
