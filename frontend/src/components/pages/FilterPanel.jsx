import FilterCheckbox from './FilterCheckbox.jsx';
import { JOB_CLASSES } from '../../constants/jobClasses.js';

function FilterPanel({ activeFilters, handleClassFilterChange }) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">Filter by class</label>
      <div className="d-flex flex-wrap gap-2">
        {JOB_CLASSES.map((jobClass) => (
          <FilterCheckbox
            key={jobClass}
            jobClass={jobClass}
            activeFilters={activeFilters}
            handleClassFilterChange={handleClassFilterChange}
          />
        ))}
      </div>
    </div>
  );
}

export default FilterPanel;
