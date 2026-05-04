function ContinueButton({ show, onClick }) {
  if (!show) return null;
  return (
    <button className="btn btn-sm btn-outline-success" onClick={onClick}>
      Continue
    </button>
  );
}

export default ContinueButton;
