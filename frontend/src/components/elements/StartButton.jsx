function StartButton({ show, onClick }) {
  if (!show) return null;
  return (
    <button className="btn btn-sm btn-outline-success" onClick={onClick}>
      Start
    </button>
  );
}

export default StartButton;
