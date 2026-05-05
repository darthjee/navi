function RestartButton({ show, onClick }) {
  if (!show) return null;
  return (
    <button className="btn btn-sm btn-outline-primary" onClick={onClick}>
      Restart
    </button>
  );
}

export default RestartButton;
