function LoadingSpinner({ message, className = 'text-center my-3' }) {
  return (
    <div className={className}>
      <div className="spinner-border" role="status" />
      <p className="mt-2">{message}</p>
    </div>
  );
}

export default LoadingSpinner;
