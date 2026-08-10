function ReloadButton({ show, onClick }) {
  if (!show) return null;
  return (
    <button className="btn btn-sm btn-outline-primary" onClick={onClick}>
      Reload
    </button>
  );
}

export default ReloadButton;
