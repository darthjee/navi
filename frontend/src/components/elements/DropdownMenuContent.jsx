function DropdownMenuContent({ baseUrls, menuStyle }) {
  return (
    <ul className="dropdown-menu show" style={menuStyle}>
      {baseUrls.map((url) => (
        <li key={url}>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="dropdown-item"
          >
            {url}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default DropdownMenuContent;
