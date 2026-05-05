function ShutdownButton({ show, onClick }) {
  if (!show) return null;
  return (
    <button className="btn btn-sm btn-danger" onClick={onClick}>
      Shut Down
    </button>
  );
}

export default ShutdownButton;
