/**
 * Bootstrap loading spinner shown while data is being fetched.
 *
 * @returns {JSX.Element}
 */
function LoadingSpinner() {
  return (
    <div className="container mt-5 text-center">
      <div className="spinner-border" role="status" />
    </div>
  );
}

export default LoadingSpinner;
