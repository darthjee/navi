function CollapsibleSection({ label, children }) {
  return (
    <details>
      <summary>{label}</summary>
      {children}
    </details>
  );
}

export default CollapsibleSection;
