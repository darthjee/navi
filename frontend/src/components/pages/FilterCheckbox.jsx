function FilterCheckbox({ jobClass, activeFilters, handleClassFilterChange }) {
  return (
    <div className="form-check form-check-inline">
      <input
        className="form-check-input"
        type="checkbox"
        id={`filter-${jobClass}`}
        checked={(activeFilters.class || []).includes(jobClass)}
        onChange={(e) => handleClassFilterChange(jobClass, e.target.checked)}
      />
      <label className="form-check-label" htmlFor={`filter-${jobClass}`}>
        {jobClass}
      </label>
    </div>
  );
}

export default FilterCheckbox;
