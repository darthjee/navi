import { Link } from 'react-router-dom';

function MenuDropdownItem({ text, route, onNavigate }) {
  if (route.startsWith('/')) {
    return (
      <li>
        <Link to={route} className="dropdown-item" onClick={onNavigate}>
          {text}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <a href={route} target="_blank" rel="noreferrer" className="dropdown-item">
        {text}
      </a>
    </li>
  );
}

export default MenuDropdownItem;
