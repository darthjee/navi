function PauseButton({ show, onClick }) {
  if (!show) return null;
  return (
    <button className="btn btn-sm btn-outline-warning" onClick={onClick}>
      Pause
    </button>
  );
}

export default PauseButton;
