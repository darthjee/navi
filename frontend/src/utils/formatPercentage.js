/**
 * Formats a percentage value rounded half-up to exactly one decimal place.
 * @param {number} value - The raw percentage value.
 * @returns {string} The formatted value, e.g. `"16.3"`.
 */
const formatPercentage = (value) => {
  return `${(Math.round(value * 10) / 10).toFixed(1)}`;
};

export default formatPercentage;
