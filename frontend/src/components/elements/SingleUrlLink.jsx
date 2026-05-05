function SingleUrlLink({ url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="btn btn-sm btn-outline-secondary"
    >
      {url}
    </a>
  );
}

export default SingleUrlLink;
