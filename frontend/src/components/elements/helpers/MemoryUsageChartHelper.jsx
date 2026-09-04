import { format } from 'date-fns';
import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import {
  colorForMemoryStatus,
  DEFAULT_MEMORY_THRESHOLDS,
  HEX_BY_STATUS,
  OVER_LIMIT_HEX,
} from '../../../constants/memoryStatus.js';
import formatBytes from '../../../utils/formatBytes.js';

const CHART_WIDTH = 640;
const CHART_HEIGHT = 260;
const LINE_HEX = HEX_BY_STATUS.low;

class MemoryUsageChartHelper {
  /**
   * Renders the memory usage line chart plus an overflow indicator when the
   * latest point exceeds 100%.
   * @param {{id: number, value: number, percentage: number, timestamp: string}[]} points
   *   The history points, oldest first.
   * @param {number} maximum - The deployment's configured maximum, in bytes.
   * @param {string} status - The current status label (`low`/`medium`/`high`/`over`).
   * @returns {JSX.Element} The rendered chart.
   */
  static render(points, maximum, status) {
    const latest = MemoryUsageChartHelper.#latestPoint(points);

    return (
      <div data-testid="memory-usage-chart">
        {/*
          Fixed pixel width/height: `ResponsiveContainer` needs
          `getBoundingClientRect`, which jsdom (the test environment) does
          not implement, so it can't be used here. Making this chart
          responsive to its container's width is intentionally deferred.
        */}
        <LineChart
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          data={points}
          margin={{ top: 8, right: 24, bottom: 8, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" tickFormatter={MemoryUsageChartHelper.#formatTick} />
          <YAxis domain={[0, 100]} allowDataOverflow unit="%" />
          <Tooltip
            labelFormatter={MemoryUsageChartHelper.#formatTick}
            formatter={(value, _name, entry) => MemoryUsageChartHelper.#formatTooltipValue(value, entry, maximum)}
          />
          <ReferenceLine
            y={DEFAULT_MEMORY_THRESHOLDS.medium}
            stroke={HEX_BY_STATUS.medium}
            strokeDasharray="4 4"
            label="medium"
          />
          <ReferenceLine
            y={DEFAULT_MEMORY_THRESHOLDS.high}
            stroke={HEX_BY_STATUS.high}
            strokeDasharray="4 4"
            label="high"
          />
          <ReferenceLine
            y={DEFAULT_MEMORY_THRESHOLDS.over}
            stroke={HEX_BY_STATUS.over}
            strokeDasharray="4 4"
            label="over"
          />
          <Line type="monotone" dataKey="percentage" stroke={LINE_HEX} dot={false} isAnimationActive={false} />
          {MemoryUsageChartHelper.#renderOverflowDot(latest)}
        </LineChart>
        {MemoryUsageChartHelper.#renderOverflowCaption(latest, status)}
      </div>
    );
  }

  static #latestPoint(points) {
    if (points.length === 0) return null;

    return points[points.length - 1];
  }

  static #isOverflowing(point) {
    return point !== null && point.percentage > 100;
  }

  static #formatTick(timestamp) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return timestamp;

    return format(date, 'HH:mm:ss');
  }

  static #formatTooltipValue(percentage, entry, maximum) {
    const bytes = entry?.payload?.value;
    if (bytes === undefined) return `${percentage}%`;

    return `${percentage}% (${formatBytes(bytes)} / ${formatBytes(maximum)})`;
  }

  // Marks the latest point on the chart itself, using `OVER_LIMIT_HEX` since
  // it's rendered by recharts (not a CSS class).
  static #renderOverflowDot(point) {
    if (!MemoryUsageChartHelper.#isOverflowing(point)) return null;

    return (
      <ReferenceDot
        x={point.timestamp}
        y={100}
        r={5}
        fill={OVER_LIMIT_HEX}
        stroke={OVER_LIMIT_HEX}
      />
    );
  }

  // Text caption below the chart, styled with the CSS class from
  // `colorForMemoryStatus` (not a raw hex value, since it's plain HTML).
  static #renderOverflowCaption(point, status) {
    if (!MemoryUsageChartHelper.#isOverflowing(point)) return null;

    const colorClass = colorForMemoryStatus(status, point.percentage);

    return (
      <p className={`mb-0 mt-2 fw-bold ${colorClass}`}>
        Memory usage exceeds the configured maximum ({point.percentage.toFixed(1)}%).
      </p>
    );
  }
}

export default MemoryUsageChartHelper;
