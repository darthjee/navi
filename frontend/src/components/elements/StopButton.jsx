function StopButton({ show, onClick }) {
  if (!show) return null;
  return (
    <button className="btn btn-sm btn-outline-danger" onClick={onClick}>
      Stop
    </button>
  );
}

export default StopButton;
