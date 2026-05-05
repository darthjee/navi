function ErrorAlert({ error, prefix, containerClassName, alertClassName = 'alert alert-danger my-3' }) {
  const alert = (
    <div className={alertClassName}>
      {prefix}: {error}
    </div>
  );

  if (!containerClassName) return alert;

  return <div className={containerClassName}>{alert}</div>;
}

export default ErrorAlert;
