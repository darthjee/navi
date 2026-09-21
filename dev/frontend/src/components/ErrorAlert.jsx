/**
 * Bootstrap danger alert shown when a fetch fails.
 *
 * @param {object} props
 * @param {string} props.message - The error message to display.
 * @returns {JSX.Element}
 */
function ErrorAlert({ message }) {
  return (
    <div className="container mt-5">
      <div className="alert alert-danger">{message}</div>
    </div>
  );
}

export default ErrorAlert;
